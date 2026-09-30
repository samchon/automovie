/** The four elevations share one visible brick/siding seam without changing their logical openings. */
require(require.resolve("tsx/cjs"));
import test from "node:test";
import assert from "node:assert/strict";
import { buildFront } from "./envelope/front";
import { buildRear } from "./envelope/rear";
import { buildLeft } from "./envelope/left";
import { buildRight } from "./envelope/right";

const EPS = 1e-6;
const TOP = 0.6;
const BOTTOM = -0.45;

const yBounds = (part: { mesh:{ positions:number[] } }) => {
  const values = part.mesh.positions.filter((_, index) => index % 3 === 1);
  return [Math.min(...values), Math.max(...values)];
};

const faceContains = (part: { mesh:{ positions:number[];indices:number[]|null } }, x: number, y: number, z: number) => {
  const { positions, indices } = part.mesh;
  assert.ok(indices);
  for (let i = 0; i < indices.length; i += 3) {
    const points = [0, 1, 2].map((j) => {
      const at = 3 * indices[i + j];
      return [positions[at], positions[at + 1], positions[at + 2]];
    });
    if (!points.every((point) => Math.abs(point[2] - z) < EPS)) continue;
    const [[ax, ay], [bx, by], [cx, cy]] = points;
    const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(det) < EPS) continue;
    const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det;
    const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det;
    if (u >= -EPS && v >= -EPS && u + v <= 1 + EPS) return true;
  }
  return false;
};

void test("brick and siding meet at one datum on all exposed elevations", () => {
    const pairs: Array<[ReturnType<typeof buildFront>, string]> = [
    [buildFront(), "front-main-wall"],
    [buildFront(), "front-garage-wall"],
    [buildRear(), "rear-main-wall"],
    [buildRear(), "rear-garage-wall"],
    [buildLeft(), "left-wall-front"],
    [buildLeft(), "left-wall-back"],
    [buildRight(), "right-main-wall-back"],
    [buildRight(), "right-main-wall-front"],
    [buildRight(), "right-garage-wall"],
  ];
  for (const [parts, id] of pairs) {
    const siding = parts.find((part) => part.id === id);
    const plinth = parts.find((part) => part.id === `${id}-plinth`);
    assert.ok(siding && plinth, id);
    assert.ok(siding.wall, id);
    assert.equal(plinth.color, 0x8c4b36, id);
    assert.equal(plinth.role, "wall", id);
    assert.equal(plinth.wall, undefined, `${id} has one logical boundary`);
    assert.equal(plinth.pendingMapGround, "map-ground-pending", id);
    assert.ok(Math.abs(yBounds(plinth)[0] - BOTTOM) < EPS, id);
    assert.ok(Math.abs(yBounds(plinth)[1] - TOP) < EPS, id);
    assert.ok(Math.abs(yBounds(siding)[0] - TOP) < EPS, id);
    assert.ok(
      Math.abs(
        Math.min(...siding.wall.outline.map((point) => point.y)) - BOTTOM,
      ) < EPS,
      id,
    );
  }
});

void test("door notches cross both finish bands without filling the opening", () => {
    const doors: Array<[ReturnType<typeof buildFront>, string, {x:number,sill:number,head:number}, number]> = [
    [buildFront(), "front-main-wall", { x: 0.9, sill: -0.175, head: 2.2 }, 0],
    [
      buildFront(),
      "front-garage-wall",
      { x: 8.6, sill: -0.3, head: 2.15 },
      -0.3,
    ],
    [buildRear(), "rear-main-wall", { x: 0, sill: -0.175, head: 2.25 }, -10.7],
  ];
  for (const [parts, id, door, z] of doors) {
    const siding = parts.find((part) => part.id === id);
    const plinth = parts.find((part) => part.id === `${id}-plinth`);
    assert.ok(siding && plinth);
    assert.ok(siding.wall);
    assert.ok(
      !faceContains(plinth, door.x, (door.sill + TOP) / 2, z),
      `${id} brick notch`,
    );
    assert.ok(
      !faceContains(siding, door.x, (TOP + door.head) / 2, z),
      `${id} siding notch`,
    );
    assert.ok(
      siding.wall.holes.some(
        (hole) =>
          hole.from < door.x &&
          hole.to > door.x &&
          hole.bottom === door.sill &&
          hole.top === door.head,
      ),
      `${id} complete opening`,
    );
  }
});
