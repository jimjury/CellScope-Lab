"""Extract educational construction/forward excerpts from the actual source (no model clones)."""
from __future__ import annotations
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'cellscope' / 'models.py'
OUT = ROOT / 'web' / 'assets' / 'model-code.generated.js'
MODELS = ['mean','linear','ridge','elasticnet','knn','svr','random_forest','extra_trees','hist_gbdt','mlp','cnn','gru','lstm','bigru','bilstm','transformer','dlinear','tcn','cnn_gru','patchtst_lite','itransformer_lite','rdb_attn_bilstm']

def build():
    source = SOURCE.read_text(encoding='utf-8')
    tree = ast.parse(source)
    src = lambda node: ast.get_source_segment(source, node) or ''
    neural = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name=='create_neural_model')
    cls = next(n for n in ast.walk(neural) if isinstance(n, ast.ClassDef) and n.name=='SequenceRegressor')
    constructor = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name=='__init__')
    forward = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name=='forward')
    def branch(fn,name):
        chains = []
        for node in ast.walk(fn):
            if isinstance(node, ast.If) and (('name' in src(node.test)) or ('self.kind' in src(node.test))):
                chains.append(node)
        matching = []
        for node in chains:
            test_text = src(node.test)
            if repr(name) in test_text or f'"{name}"' in test_text:
                # The body of one exact branch, extracted from the real source.
                matching.append('\n'.join(src(n) for n in node.body))
        return matching[0] if matching else ''
    baseline = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name=='create_baseline_model')
    model_dict = next(n for n in ast.walk(baseline) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='models' for t in n.targets)).value
    factory = {}
    for key,fn in zip(model_dict.keys,model_dict.values):
        factory[key.value] = src(fn)
    classes={n.name:src(n) for n in tree.body if isinstance(n,ast.ClassDef)}
    train=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='train_neural')
    train_lines=src(train).splitlines()
    training='\n'.join(line for line in train_lines if any(a in line for a in ('def train_neural','torch.manual_seed','opt = ','loss = ','loss.backward','opt.step','model.eval','val_loss =','if val_loss <','model.load_state_dict')))
    notes={
       'mean':['Only the training target mean is stored.','The trivial baseline reveals whether the data and evaluation pipeline work.'],
       'ridge':['Window is flattened, centered, and fitted by regularized least squares.','Ridge is an effective low-complexity comparison.'],
       'linear':['Ordinary least-squares regression on flattened windows.','Correlated adjacent points can make coefficients unstable.'],
       'elasticnet':['L1 + L2 regularization on flattened windows.','Tune alpha on validation, never test.'],
       'knn':['Distance-weighted neighbors in normalized feature space.','Scale features first; beware high-dimensional distances.'],
       'svr':['RBF kernel support vector regression.','Nonlinear baseline, sensitive to scaling and C/epsilon.'],
       'random_forest':['Bagged decision trees.','Feature importance is not a causal proof.'],
       'extra_trees':['More randomized tree splits.','Good for structural comparison with Random Forest.'],
       'hist_gbdt':['Histogram gradient boosting of compact decision trees.','Tune iteration budget and leaves on validation.'],
       'mlp':['Flatten window, dense-ReLU-dense.','Does not explicitly model chronological ordering.'],
       'cnn':['Conv1D over the sensor timeline.','Preserves local patterns but pools global position.'],
       'gru':['Gated recurrent neural network.','Output uses the final observed hidden state.'],
       'lstm':['Long short-term memory encoder.','Output uses the final observed hidden state.'],
       'bigru':['Bidirectional GRU INSIDE the observed history window.','Does not imply seeing future target-time values.'],
       'bilstm':['Bidirectional LSTM inside history.','Input horizon must still end before prediction cutoff.'],
       'transformer':['One-layer Transformer encoder, positional encoding, pooled output.','A compact original baseline, not any original paper reproduction.'],
       'dlinear':['Separate trend and residual linear projections.','Causal window stays within available observations.'],
       'tcn':['Dilated 1D convolutions with residual skip.','The right padded tail is cropped to preserve causality.'],
       'cnn_gru':['Conv1D local extractor then single-layer GRU.','Compare against each independent branch.'],
       'patchtst_lite':['Overlapping patches then encoder self-attention.','Inspired, NOT full PatchTST reproduction.'],
       'itransformer_lite':['Channels become attention tokens.','Inspired, NOT full iTransformer reproduction.'],
       'rdb_attn_bilstm':['Depthwise separable residual convolution → BiLSTM → attention.','Residual input and output shapes must match.'],
    }
    result={}
    for name in MODELS:
        if name=='mean': buildcode=classes['MeanRegressor'];fw='predict = model.predict(x)'
        elif name=='ridge': buildcode=classes['RidgeRegressor'];fw='predict = model.predict(x)'
        elif name in factory:
            buildcode='model = '+factory[name];fw='model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))'
        else:
            buildcode=branch(constructor,name);fw=branch(forward,name)
        if not buildcode or not fw: raise RuntimeError(f'Could not extract actual source code for {name}')
        result[name]={'id':name,'family':'classical' if name in {'mean','ridge',*factory} else 'neural','build':buildcode,'forward':fw,'notes':notes[name], 'source':'cellscope/models.py'}
    meta={'sha256':hashlib.sha256(source.encode()).hexdigest(),'models':result,'training':training,
          'disclaimer':'Source excerpts, not standalone code. The complete model implementations are in cellscope/models.py.'}
    OUT.write_text('/* AUTO-GENERATED from cellscope/models.py by scripts/build_model_code.py. */\nwindow.CellModelCode = '+json.dumps(meta,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    return meta
if __name__ == '__main__':
    output=build()
    print('Generated',len(output['models']),'real source excerpts SHA',output['sha256'][:12])
