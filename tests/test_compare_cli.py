import json
from cellscope.cli import main
from cellscope.synthetic import generate_demo


def test_compare_models_uses_identical_source_and_splits(tmp_path):
    source=tmp_path/'synthetic.csv'
    generate_demo(source,cells=5,cycles=7,points=9,seed=7)
    cfg={'task':'soc','model':'ridge','data':{'path':str(source),'phase':'discharge',
         'discharge_sign':'negative','max_gap_sec':2,'synthetic':True},
         'features':{'window':4,'normalization':'minmax'},
         'split':{'unit':'battery','seed':42,'val_fraction':.2,'test_fraction':.2},
         'train':{'epochs':1,'hidden':16,'batch_size':64,'n_estimators':5}}
    config=tmp_path/'config.json';config.write_text(json.dumps(cfg))
    result=main(['compare','--config',str(config),'--models','ridge,mean',
                 '--out',str(tmp_path/'benchmark')])
    assert result['schema_version']=='cellscope-comparison-v1'
    assert len(result['models'])==2
    assert (tmp_path/'benchmark'/'comparison.csv').is_file()
    assert (tmp_path/'benchmark'/'comparison.json').is_file()
    assert result['source_sha256']==json.loads((tmp_path/'benchmark'/'mean'/'metrics.json').read_text())['source']['sha256']
