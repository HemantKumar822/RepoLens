import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseTrafficRoutes } from '../src/world/traffic.mjs';

function road(start, end, kind = 'street', width = 0.8) {
  return { start, end, kind, width };
}

test('routes the small fleet along the main avenue and nearby parallel streets', () => {
  const roads = [
    road({ x: -10, z: -5 }, { x: 10, z: -5 }),
    road({ x: 0, z: -10 }, { x: 0, z: 10 }, 'avenue', 1.42),
    road({ x: -10, z: 0 }, { x: 10, z: 0 }, 'avenue', 1.42),
    road({ x: -10, z: 5 }, { x: 10, z: 5 }),
    road({ x: -10, z: 10 }, { x: 10, z: 10 }),
  ];

  const routes = chooseTrafficRoutes(roads, 0);

  assert.deepEqual(routes.map((item) => (item.start.z + item.end.z) / 2), [0, -5, 5]);
  assert.ok(routes.every((item) => Math.abs(item.start.z - item.end.z) < 0.01));
  assert.equal(new Set(routes).size, routes.length);
});

test('keeps traffic bounded and handles small or empty road networks', () => {
  const roads = [
    road({ x: -10, z: 0 }, { x: 10, z: 0 }, 'avenue', 1.42),
    road({ x: -10, z: 3 }, { x: 10, z: 3 }),
    road({ x: -10, z: -3 }, { x: 10, z: -3 }),
    road({ x: -10, z: -6 }, { x: 10, z: -6 }),
  ];

  assert.equal(chooseTrafficRoutes(roads, 0, 20).length, 3);
  assert.equal(chooseTrafficRoutes(roads.slice(0, 1), 0).length, 1);
  assert.deepEqual(chooseTrafficRoutes([], 0), []);
});
