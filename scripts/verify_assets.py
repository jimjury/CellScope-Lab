"""Check that JSON source files and committed browser wrappers match exactly."""
import json
import re
import hashlib
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]
        self.scripts=[]
        self.styles=[]
        self.anchors=[]
        self.buttons=[]
        self.body_light=False
    def handle_starttag(self, tag, attrs):
        options=dict(attrs)
        if 'id' in options:
            self.ids.append(options['id'])
        if tag=='script' and 'src' in options:
            self.scripts.append(options['src'])
        if tag=='link' and options.get('rel') == 'stylesheet':
            self.styles.append(options['href'])
        if tag=='a' and options.get('href','').startswith('#'):
            self.anchors.append(options['href'][1:])
        if tag=='button':
            self.buttons.append(options)
        if tag=='body':
            self.body_light='light' in options.get('class','').split()


def main():
    for key, filename, dest in [
        ('CELLSCOPE_CATALOG','catalog.json','catalog.generated.js'),
        ('CELLSCOPE_DEMO_RUN','demo_run.json','demo.generated.js')]:
        data=json.loads((ROOT/'web/data'/filename).read_text(encoding='utf-8'))
        text=(ROOT/'web/assets'/dest).read_text(encoding='utf-8')
        match=re.search(rf'window\.{key} = (.+);\s*$',text,re.DOTALL)
        assert match, f'{dest} is missing or malformed'
        assert json.loads(match.group(1))==data, f'{dest} is stale: run scripts/sync_assets.py'
    page=PageParser()
    page.feed((ROOT/'web/index.html').read_text(encoding='utf-8'))
    assert len(page.ids)==len(set(page.ids)), 'Repeated HTML IDs'
    assert len(page.ids)>=70
    assert page.body_light, 'Website must default to the light theme'
    for relative in page.scripts + page.styles:
        assert relative.startswith('./assets/'), f'External or unsafe executable asset: {relative}'
        assert (ROOT/'web'/relative).is_file(), f'Broken asset reference: {relative}'
    for anchor in page.anchors:
        assert anchor in page.ids or anchor == '', f'Broken in-page anchor: #{anchor}'
    app=(ROOT/'web/assets/app.js').read_text(encoding='utf-8')
    academy=(ROOT/'web/assets/academy-ui.js').read_text(encoding='utf-8')
    for button in page.buttons:
        if 'id' in button:
            assert re.search(rf"\bon\(['\"]{re.escape(button['id'])}['\"]", app+academy), f"Unwired button ID: {button['id']}"
        else:
            tagged=[tag for tag in ('data-ask','data-filter','data-metric-type','data-code-tab') if tag in button]
            assert tagged or button.get('type') == 'submit', f'Undocumented button: {button}'
            for tag in tagged:
                assert tag in app+academy, f'Unwired data selector {tag}'
    import subprocess
    js=(ROOT/'web/assets/model-code.generated.js').read_text(encoding='utf-8')
    part=js.split('window.CellModelCode = ',1)[1].strip().removesuffix(';')
    info=json.loads(part)
    assert len(info['models'])==22
    assert info['sha256']==hashlib.sha256((ROOT/'cellscope/models.py').read_bytes()).hexdigest(),'Model-code excerpts stale'
    assert (ROOT/'web/guide.en.html').is_file(), 'English guide missing'
    assert (ROOT/'web/guide.html').is_file(), 'Chinese guide missing'
    print(f'PASS assets, {len(page.ids)} unique IDs, {len(page.scripts)} local scripts, {len(page.styles)} styles, {len(page.buttons)} wired static buttons, 22 hashed model excerpts')


if __name__=='__main__':
    main()
