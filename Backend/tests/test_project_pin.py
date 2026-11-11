from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient
from featx.main import create_app
from featx.store import Store


class ProjectPinTests(TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.data = root / 'data'
        self.app = create_app(self.data, shared_dir=root / 'shared')
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)
        self.ids = ['a' * 32, 'b' * 32, 'c' * 32]
        for project_id in self.ids:
            self.app.state.store.write({'id': project_id, 'name': project_id,
                                        'source': {'kind': 'upload', 'filename': 'demo.zip'},
                                        'tags': [{'name': '应用示范案例', 'color': 'blue'}]})

    def pin(self, index, pinned):
        response = self.client.patch(f'/api/projects/{self.ids[index]}/pin', json={'pinned': pinned})
        self.assertEqual(200, response.status_code, response.text)
        return response.json()

    def test_order_persistence_idempotency_and_repin(self):
        self.assertIsNone(self.client.get('/api/projects').json()[0]['pinnedAt'])
        with patch('featx.projects.datetime') as clock:
            clock.now.return_value = datetime(2026, 1, 1, tzinfo=timezone.utc)
            clock.fromisoformat.side_effect = datetime.fromisoformat
            first = self.pin(0, True)
            second = self.pin(1, True)
            self.assertGreater(second['pinnedAt'], first['pinnedAt'])
            self.assertEqual(first['pinnedAt'], self.pin(0, True)['pinnedAt'])
            self.assertEqual([self.ids[1], self.ids[0], self.ids[2]],
                             [p['id'] for p in self.client.get('/api/projects').json()])
            self.assertEqual(second['pinnedAt'], Store(self.data).read(self.ids[1])['pinnedAt'])
            self.assertIsNone(self.pin(0, False)['pinnedAt'])
            latest = self.pin(0, True)
            self.assertGreater(latest['pinnedAt'], second['pinnedAt'])
        self.client.patch(f'/api/projects/{self.ids[0]}', json={'name': 'Renamed'})
        self.assertEqual(latest['pinnedAt'], self.app.state.store.read(self.ids[0])['pinnedAt'])
        self.assertEqual(first['tags'], latest['tags'])
        self.pin(0, False)
        self.pin(1, False)
        self.assertEqual(self.ids, [p['id'] for p in self.client.get('/api/projects').json()])

    def test_validation_and_missing_project(self):
        path = f'/api/projects/{self.ids[0]}/pin'
        for body in ({}, {'pinned': None}, {'pinned': 'true'}, {'pinned': True, 'pinnedAt': 'fake'}):
            self.assertEqual(422, self.client.patch(path, json=body).status_code)
        self.assertEqual(404, self.client.patch('/api/projects/' + 'd' * 32 + '/pin',
                                               json={'pinned': True}).status_code)
