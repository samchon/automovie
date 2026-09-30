#!/usr/bin/env node
/** Refuse vertical faces inside the front T-walk or three-band side-walk union. */
require(require.resolve("tsx/cjs"));
import { buildHouse } from "../spaces/house";
const parts = buildHouse().parts.filter((p) => p.role === "paving");
type P = { x:number;y:number;z:number };
type Mesh = { positions:ArrayLike<number>;indices?:ArrayLike<number>|null };
const point = (mesh: Mesh, index: number): P => ({
  x: mesh.positions[index * 3],
  y: mesh.positions[index * 3 + 1],
  z: mesh.positions[index * 3 + 2],
});
const triangle = (mesh: Mesh, i: number): P[] => [0, 1, 2].map((k) =>
  point(mesh, mesh.indices ? mesh.indices[i + k] : i + k),
);
const tops: Array<{ id:string;t:P[] }> = [];
const sides: Array<{ id:string;t:P[];n:P }> = [];
for (const part of parts) {
  const mesh = part.mesh;
  const count = mesh.indices ? mesh.indices.length : mesh.positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const t = triangle(mesh, i);
    const u = { x: t[1].x - t[0].x, y: t[1].y - t[0].y, z: t[1].z - t[0].z };
    const v = { x: t[2].x - t[0].x, y: t[2].y - t[0].y, z: t[2].z - t[0].z };
    const n = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x,
    };
    const length = Math.hypot(n.x, n.y, n.z);
    if (length < 1e-12) continue;
    n.x /= length;
    n.y /= length;
    n.z /= length;
    if (n.y > 0.5) tops.push({ id: part.id, t });
    else if (Math.abs(n.y) < 1e-6) sides.push({ id: part.id, t, n });
  }
}
const inside = (x: number, z: number, t: P[]) => {
    const sign = (a: P, b: P) => (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x);
  const values = [sign(t[0], t[1]), sign(t[1], t[2]), sign(t[2], t[0])];
  return !(values.some((n) => n < -1e-9) && values.some((n) => n > 1e-9));
};
const union = (id: string) => id === "front-walk" || id.startsWith("front-walk-connector-")
  ? "front"
  : id === "side-walk-long" || id === "side-walk-back" || id.startsWith("side-walk-front-connector-")
    ? "side"
    : null;
const pairs: Record<string,number> = {};
for (const side of sides) {
  const group = union(side.id);
  if (!group) continue;
  const x = (side.t[0].x + side.t[1].x + side.t[2].x) / 3 + 0.01 * side.n.x;
  const z = (side.t[0].z + side.t[1].z + side.t[2].z) / 3 + 0.01 * side.n.z;
  const match = tops.find(
    (top) => top.id !== side.id && union(top.id) === group && inside(x, z, top.t),
  );
  if (match) pairs[`${side.id} | ${match.id}`] = (pairs[`${side.id} | ${match.id}`] ?? 0) + 1;
}
const internal = Object.values(pairs).reduce((sum, n) => sum + n, 0);
console.log(
  JSON.stringify({
    pavingParts: parts.length,
    verticalTriangles: sides.length,
    unionInternalSides: internal,
    pairs,
  }),
);
if (internal) process.exitCode = 1;
