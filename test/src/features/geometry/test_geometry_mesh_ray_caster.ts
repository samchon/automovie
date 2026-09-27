import { createAutoMovieMeshRayCaster } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Rays find the first resident triangle along them, through a hierarchy that
 * must agree with testing every triangle.
 *
 * Scenarios:
 * 1. Two parallel unit squares at z = 1 and z = 3 (two triangles each): a
 *    ray up from the origin inside them meets z = 1 first, at distance 1 for
 *    any direction length; with `minimum` past 1 it meets z = 3; within a
 *    shorter `maximum` it meets none; `blocked` agrees. Winding is
 *    immaterial; an edge belongs to its triangles; a grazing ray and one
 *    outside the squares pass.
 * 2. A field of 200 small triangles: for 300 rays the hierarchy's nearest
 *    distance equals the brute-force one (so the splits lose no triangle),
 *    and a ray parallel to an axis crosses boxes on that axis's plane.
 * 3. Editing caller buffers cannot change a built caster; nonindexed input
 *    finds the same hits; an empty mesh finds none.
 * 4. Incomplete, nonfinite or out-of-range buffers and a zero direction,
 *    nonfinite origin or inverted range refuse.
 */
export const test_geometry_mesh_ray_caster = (): void => {
  const mesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const square = (z: number, flip: boolean) => {
    const p = [0, 0, z, 1, 0, z, 1, 1, z, 0, 1, z];
    return {
      positions: p,
      indices: flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3],
    };
  };
  const a = square(1, false);
  const b = square(3, true);
  const positions = [...a.positions, ...b.positions];
  const indices = [...a.indices, ...b.indices.map((i) => i + 4)];
  const caster = createAutoMovieMeshRayCaster(mesh(positions, indices));
  const up = [0, 0, 5];
  TestValidator.predicate(
    "two planes",
    nclose(caster.nearest([0.3, 0.4, 0], up, 10)!, 1) &&
      nclose(caster.nearest([0.3, 0.4, 0], up, 10, 1.5)!, 3) &&
      caster.nearest([0.3, 0.4, 0], up, 0.5) === null &&
      caster.blocked([0.3, 0.4, 0], up, 10) &&
      !caster.blocked([0.3, 0.4, 0], up, 0.5) &&
      nclose(caster.nearest([0.5, 0.5, 0], up, 10)!, 1) &&
      nclose(caster.nearest([1, 1, 0], up, 10)!, 1) &&
      caster.nearest([0.3, 0.4, 1], [1, 0, 0], 10) === null &&
      caster.nearest([2, 2, 0], up, 10) === null &&
      nclose(caster.nearest([0.2, 0.2, 5], [0, 0, -1], 10)!, 2),
  );
  // A field of small triangles and random rays against brute force.
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const field: number[] = [];
  for (let t = 0; t < 200; ++t) {
    const c = [random() * 4 - 2, random() * 4 - 2, random() * 4 - 2];
    for (let k = 0; k < 3; ++k)
      field.push(
        c[0] + random() * 0.6 - 0.3,
        c[1] + random() * 0.6 - 0.3,
        c[2] + random() * 0.6 - 0.3,
      );
  }
  const fieldCaster = createAutoMovieMeshRayCaster(mesh(field, null));
  const brute = (o: number[], d: number[]) => {
    const l = Math.hypot(...d);
    const n = d.map((v) => v / l);
    let best: number | null = null;
    for (let t = 0; t < 200; ++t) {
      const [p0, p1, p2] = [0, 1, 2].map((k) =>
        field.slice(9 * t + 3 * k, 9 * t + 3 * k + 3),
      );
      const e1 = [0, 1, 2].map((i) => p1![i]! - p0![i]!);
      const e2 = [0, 1, 2].map((i) => p2![i]! - p0![i]!);
      const p = [
        n[1]! * e2[2]! - n[2]! * e2[1]!,
        n[2]! * e2[0]! - n[0]! * e2[2]!,
        n[0]! * e2[1]! - n[1]! * e2[0]!,
      ];
      const det = e1[0]! * p[0]! + e1[1]! * p[1]! + e1[2]! * p[2]!;
      if (Math.abs(det) < 1e-18) continue;
      const s = [0, 1, 2].map((i) => o[i]! - p0![i]!);
      const u = (s[0]! * p[0]! + s[1]! * p[1]! + s[2]! * p[2]!) / det;
      if (u < 0 || u > 1) continue;
      const q = [
        s[1]! * e1[2]! - s[2]! * e1[1]!,
        s[2]! * e1[0]! - s[0]! * e1[2]!,
        s[0]! * e1[1]! - s[1]! * e1[0]!,
      ];
      const v = (n[0]! * q[0]! + n[1]! * q[1]! + n[2]! * q[2]!) / det;
      if (v < 0 || u + v > 1) continue;
      const hit = (e2[0]! * q[0]! + e2[1]! * q[1]! + e2[2]! * q[2]!) / det;
      if (hit >= 0 && hit <= 20 && (best === null || hit < best)) best = hit;
    }
    return best;
  };
  let agree = true;
  let hits = 0;
  for (let r = 0; r < 300; ++r) {
    const o = [random() * 6 - 3, random() * 6 - 3, random() * 6 - 3];
    const d =
      r % 10 === 0
        ? [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ][r % 3]!
        : [random() - 0.5, random() - 0.5, random() - 0.5];
    const expected = brute(o, d);
    const found = fieldCaster.nearest(o, d, 20);
    if (expected !== null) ++hits;
    if (
      (expected === null) !== (found === null) ||
      (expected !== null && !nclose(found!, expected, 1e-9)) ||
      fieldCaster.blocked(o, d, 20) !== (expected !== null)
    )
      agree = false;
  }
  TestValidator.predicate(
    "hierarchy agrees with brute force",
    agree && hits > 20,
  );
  const editable = mesh([...positions], [...indices]);
  const frozen = createAutoMovieMeshRayCaster(editable);
  editable.positions.fill(100);
  const flat = indices.flatMap((i) => positions.slice(3 * i, 3 * i + 3));
  TestValidator.predicate(
    "snapshots, nonindexed input, empty mesh",
    nclose(frozen.nearest([0.3, 0.4, 0], up, 10)!, 1) &&
      nclose(
        createAutoMovieMeshRayCaster(mesh(flat, null)).nearest(
          [0.3, 0.4, 0],
          up,
          10,
        )!,
        1,
      ) &&
      createAutoMovieMeshRayCaster(mesh([], [])).nearest([0, 0, 0], up, 10) ===
        null,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => createAutoMovieMeshRayCaster(mesh([0, 0], null)),
      "complete triangle",
    ) &&
      throwsError(
        () =>
          createAutoMovieMeshRayCaster(
            mesh([0, 0, 0, 1, 0, 0, 0, 1, NaN], null),
          ),
        "complete triangle",
      ) &&
      throwsError(
        () => createAutoMovieMeshRayCaster(mesh(positions, [0, 1, 99])),
        "complete triangle",
      ) &&
      throwsError(() => caster.nearest([0, 0, 0], [0, 0, 0], 1), "nonzero") &&
      throwsError(() => caster.nearest([0, NaN, 0], up, 1), "nonzero") &&
      throwsError(() => caster.nearest([0, 0, 0], up, 1, 2), "minimum") &&
      throwsError(() => caster.blocked([0, 0], up, 1), "nonzero"),
  );
};
