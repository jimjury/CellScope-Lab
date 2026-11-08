"""v0.2 checks: every displayed model has an executable train/predict path."""
import json
from pathlib import Path
import numpy as np
import pytest
from cellscope.models import ALL_MODELS, BASELINES, NEURAL, create_neural_model
from cellscope.pipeline import run_experiment
from cellscope.synthetic import generate_demo


def test_registry_exactly_22_unique_methods():
    assert len(ALL_MODELS) == 22
    assert len(BASELINES) == 9
    assert len(NEURAL) == 13
    assert BASELINES.isdisjoint(NEURAL)


@pytest.mark.parametrize('model_name', sorted(ALL_MODELS))
def test_every_model_executes_real_soc_pipeline(tmp_path, model_name):
    if model_name in NEURAL:
        pytest.importorskip('torch')
    if model_name in BASELINES - {'mean', 'ridge'}:
        pytest.importorskip('sklearn')
    source = tmp_path / 'synthetic.csv'
    generate_demo(source, cells=5, cycles=7, points=9, seed=3)
    cfg = {
        'task':'soc','model':model_name,
        'data': {'path':str(source), 'phase':'discharge', 'discharge_sign':'negative',
                 'max_gap_sec':2, 'synthetic':True},
        'features':{'window':4,'normalization':'standard'},
        'split': {'unit':'battery','seed':42,'val_fraction':.2,'test_fraction':.2},
        'train':{'epochs':1,'hidden':16,'batch_size':64,'n_estimators':7,
                 'n_neighbors':3,'alpha':1.0,'lr':.001,'shuffle':False},
    }
    result=run_experiment(cfg,output_dir=tmp_path/'run')
    assert result['model']==model_name
    assert len(result['source']['sha256'])==64
    assert result['metrics']['test']['n']>0
    assert np.isfinite(result['metrics']['test']['rmse'])
    assert result['selection']['uses_test_for_model_selection'] is False
    assert result['audit']['window_crosses_cycle'] is False
    assert result['audit']['input_does_not_contain_target'] is True
    assert (tmp_path/'run'/'predictions_test.csv').is_file()
    assert (tmp_path/'run'/'weights.pt').exists() == (model_name in NEURAL)
    report=json.loads((tmp_path/'run'/'metrics.json').read_text(encoding='utf8'))
    assert report['source']['synthetic'] is True


@pytest.mark.parametrize('model_name', sorted(NEURAL))
def test_every_neural_variant_has_gradients(model_name):
    torch=pytest.importorskip('torch')
    net=create_neural_model(model_name, 8, 3, hidden=16)
    x=torch.randn(3,8,3)
    loss=net(x).square().mean()
    assert torch.isfinite(loss)
    loss.backward()
    assert any(p.grad is not None and torch.isfinite(p.grad).all() and p.grad.abs().sum()>0
               for p in net.parameters())


def test_transformer_hidden_must_divide_4():
    pytest.importorskip('torch')
    with pytest.raises(ValueError,match='divisible by 4'):
        create_neural_model('patchtst_lite',16,3,hidden=15)


def test_invalid_model_is_rejected(tmp_path):
    source=tmp_path/'synthetic.csv'
    generate_demo(source,cells=5,cycles=7,points=9)
    with pytest.raises(ValueError,match='Unknown model'):
        run_experiment({'task':'soc','model':'imaginary','data':{'path':str(source)}},output_dir=tmp_path/'x')
