"""Serve the actual GitHub Pages web root and exercise all locally linked assets."""
from __future__ import annotations
import contextlib
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from html.parser import HTMLParser
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
from urllib.parse import urljoin

WEB = Path(__file__).resolve().parents[1] / 'web'


class LocalAssetLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.local_assets = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        url = (d.get('src') if tag == 'script' else d.get('href') if tag == 'link' else None)
        if url and url.startswith('./'):
            self.local_assets.append(url)


def run():
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    handler = functools.partial(QuietHandler, directory=str(WEB))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    server.daemon_threads = True
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}/'
    try:
        tested = set()
        for page in ['index.html', 'guide.html', 'guide.en.html']:
            with urlopen(urljoin(base, page), timeout=5) as response:
                assert response.status == 200
                assert 'text/html' in response.headers['content-type']
                content = response.read().decode('utf-8')
                assert 'CellScope' in content or 'CellScope'.lower() in content.lower()
            links = LocalAssetLinks()
            links.feed(content)
            tested.add(page)
            for ref in links.local_assets:
                link = urljoin(urljoin(base, page), ref)
                with urlopen(link, timeout=5) as response:
                    assert response.status == 200, link
                    assert int(response.headers['Content-Length']) > 0, link
                    content_type = response.headers.get('Content-Type', '')
                    if ref.endswith('.js'):
                        assert 'javascript' in content_type or 'text/plain' in content_type, (link, content_type)
                    if ref.endswith('.css'):
                        assert 'text/css' in content_type, (link, content_type)
                    response.read()
                tested.add(ref)
        print(f'PASS HTTP: {len(tested)} actual HTML/CSS/JS files served with 200 and nonempty content')
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


if __name__ == '__main__':
    run()
