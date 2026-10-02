import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

type Vec = [number, number, number];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: Vec, b: Vec, t: number): Vec => [
  a[0] + t * b[0],
  a[1] + t * b[1],
  a[2] + t * b[2],
];

/** Closest point on a triangle to p, by Ericson's region walk. */
const closest = (p: Vec, a: Vec, b: Vec, c: Vec): Vec => {
  const ab = sub(b, a),
    ac = sub(c, a),
    ap = sub(p, a);
  const d1 = dot(ab, ap),
    d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b);
  const d3 = dot(ab, bp),
    d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, ab, d1 / (d1 - d3));
  const cp = sub(p, c);
  const d5 = dot(ab, cp),
    d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)));
  const denominator = 1 / (va + vb + vc);
  return add(add(a, ab, vb * denominator), ac, vc * denominator);
};

/**
 * The bounding-box hierarchy, including the per-triangle box test inside a
 * leaf, returns the distance an exhaustive search over every triangle finds,
 * and reports a triangle that attains it.
 * Scenarios:
 * 1. A 4 x 4 x 2 voxel slab (well over one leaf of triangles) is queried at a
 *    lattice of points outside, on the near side of and inside the surface;
 *    each distance equals the exhaustive minimum from an independent
 *    closest-point routine.
 * 2. The triangle the query names lies at that same minimum distance, so a
 *    skipped triangle was never the nearest one.
 * 3. A second walk along a line, which keeps the previous feature as the
 *    starting bound, agrees as well.
 */
export const test_geometry_signed_mesh_box_pruning = (): void => {
  const cells: number[][] = [];
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 4; y++) for (let z = 0; z < 2; z++) cells.push([x, y, z]);
  const mesh = createSignedVoxelUnion(cells);
  const sample = createAutoMovieSignedMeshQuery(mesh);
  const exhaustive = (p: Vec): { least: number; at: number[] } => {
    const at: number[] = [];
    for (let t = 0; t < mesh.indices!.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => {
        const i = mesh.indices![t + k];
        return [
          mesh.positions[3 * i],
          mesh.positions[3 * i + 1],
          mesh.positions[3 * i + 2],
        ] as Vec;
      });
      const q = closest(p, a, b, c);
      at.push(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
    }
    return { least: Math.min(...at), at };
  };
  const check = (p: Vec): boolean => {
    const hit = sample(p);
    const { least, at } = exhaustive(p);
    return (
      nclose(hit.distance, least, 1e-9) && nclose(at[hit.triangle], least, 1e-9)
    );
  };
  const lattice: Vec[] = [];
  for (let x = -1.5; x <= 5.5; x += 0.7)
    for (let y = -1.5; y <= 5.5; y += 0.7)
      for (let z = -1.5; z <= 3.5; z += 0.7) lattice.push([x, y, z]);
  TestValidator.predicate(
    "every lattice point matches the exhaustive nearest distance",
    lattice.every(check),
  );
  const walk: Vec[] = [];
  for (let k = 0; k < 60; k++) walk.push([-1 + 0.1 * k, 1.3 + 0.01 * k, 2.6 - 0.05 * k]);
  TestValidator.predicate(
    "a walking sequence matches as well",
    walk.every(check),
  );
};
