import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";

/**
 * Prepare fixed half-plane directions for independent changing-offset queries.
 * Copy the admitted finite unit normals and compute every exact nonparallel pair
 * once. A weak pair remains in the plan: its feasibility depends on each query's
 * offsets, so only a feasible weak intersection refuses. Offsets and resulting
 * vertices are never cached or shared between queries.
 * Callers bound the plane population and supply bounded section charts.
 *
 * @evidence contracts/common.md#principled-implementation Fixed normal-pair determinants are invariant under changing offsets. Each query performs the same line intersections, exact-sign inequality classification, incidence identities and XZ winding as the one-shot section query, with feasible weak-direction refusal.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine preparation owner serves repeated physical sections in inverse fitting and continuous planning; the existing one-shot query delegates to it without a second implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No offset result, coordinate weld, source geometry or specimen condition supplies an intersection. Weak pairs are not discarded before actual feasibility is known, and copied directions cannot change through the caller's arrays.
 * @evidence contracts/common.md#meaningful-documentation States admitted unit/chart premises, copied direction ownership, offset independence, deferred weak refusal and caller-owned preparation lifetime.
 * @evidence contracts/performance.md#efficient-algorithms For P bounded planes, preparation costs and retains O(P squared) pair records; Q changing-offset queries cost O(Q P cubed) and retain O(P squared) query scratch each. Fixed determinant preparation no longer repeats per offset set; rejected pairs retain scalar scratch rather than allocating vertex and incidence arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work One caller-owned query reuses copied normal values and their exact nonparallel determinants while those fixed directions remain equivalent. Changing offsets always produce fresh intersections/incidence and never reuse an earlier result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned CPU closure retains only O(P squared) fixed direction records until the caller releases it. Each query transfers fresh vertices and discards its maps; no image, file, worker or global input-dependent cache is retained.
 */
export function createAutoMovieSupportSectionQuery(input: {
  normals: readonly (readonly [number, number])[];
  minimumDirectionSine: number;
}): (offsets: readonly number[]) => {
  pair: [number, number];
  tight: number[];
  point: [number, number];
}[] {
  const normals: [number, number][] = input.normals.map(
    (normal: readonly [number, number]): [number, number] => [
      normal[0],
      normal[1],
    ],
  );
  const minimumDirectionSine: number = input.minimumDirectionSine;
  const pairs: { i: number; j: number; determinant: number }[] = [];
  for (let i: number = 0; i < normals.length; i++)
    for (let j: number = i + 1; j < normals.length; j++) {
      const a: readonly [number, number] = normals[i],
        b: readonly [number, number] = normals[j];
      const determinant: number = determinantAutoMovieMatrix3([
        a[0],
        a[1],
        0,
        b[0],
        b[1],
        0,
        0,
        0,
        1,
      ]);
      if (determinant !== 0) pairs.push({ i, j, determinant });
    }
  return (
    offsets: readonly number[],
  ): {
    pair: [number, number];
    tight: number[];
    point: [number, number];
  }[] => {
    const vertices: Map<
      string,
      { pair: [number, number]; tight: number[]; point: [number, number] }
    > = new Map();
    const scale: number = Math.max(...offsets.map(Math.abs));
    for (const pair of pairs) {
      const i: number = pair.i,
        j: number = pair.j,
        determinant: number = pair.determinant;
      const a: readonly [number, number] = normals[i],
        b: readonly [number, number] = normals[j];
      const x: number = (offsets[i] * b[1] - a[1] * offsets[j]) / determinant;
      const z: number = (a[0] * offsets[j] - offsets[i] * b[0]) / determinant;
      if (!Number.isFinite(x) || !Number.isFinite(z))
        throw new Error(
          "nonfinite-support-intersection: chart exceeds binary64 coordinates",
        );
      const epsilon: number =
        (512 * Number.EPSILON * Math.max(scale, Math.abs(x), Math.abs(z))) /
        determinant ** 2;
      let tight: number[] | undefined;
      let feasible: boolean = true;
      for (let k: number = 0; k < normals.length; k++) {
        if (k === i || k === j) continue;
        const residual: number =
          normals[k][0] * x + normals[k][1] * z - offsets[k];
        const sign: number =
          Math.abs(residual) > epsilon
            ? Math.sign(residual)
            : -Math.sign(determinant) *
              Math.sign(
                determinantAutoMovieMatrix3([
                  a[0],
                  a[1],
                  offsets[i],
                  b[0],
                  b[1],
                  offsets[j],
                  normals[k][0],
                  normals[k][1],
                  offsets[k],
                ]),
              );
        if (!Number.isFinite(residual) || sign > 0) {
          feasible = false;
          break;
        }
        if (sign === 0) {
          tight ??= [i, j];
          tight.push(k);
        }
      }
      if (!feasible) continue;
      if (Math.abs(determinant) < minimumDirectionSine)
        throw new Error(
          "weak-support-boundary: feasible plane pair is unresolved",
        );
      tight ??= [i, j];
      tight.sort((a: number, b: number): number => a - b);
      const key: string = tight.join(":");
      if (!vertices.has(key))
        vertices.set(key, { pair: [i, j], tight, point: [x, z] });
    }
    const result: ReturnType<
      ReturnType<typeof createAutoMovieSupportSectionQuery>
    > = [...vertices.values()];
    if (result.length < 3)
      throw new Error(
        "unsupported-support-section: finite positive-area polygon required",
      );
    const centre: [number, number] = result.reduce(
      (
        sum: [number, number],
        vertex: (typeof result)[number],
      ): [number, number] => [
        sum[0] + vertex.point[0] / result.length,
        sum[1] + vertex.point[1] / result.length,
      ],
      [0, 0],
    );
    result.sort(
      (a: (typeof result)[number], b: (typeof result)[number]): number =>
        Math.atan2(a.point[1] - centre[1], a.point[0] - centre[0]) -
        Math.atan2(b.point[1] - centre[1], b.point[0] - centre[0]),
    );
    let area: number = 0;
    for (let i: number = 0; i < result.length; i++) {
      const a: [number, number] = result[i].point;
      const b: [number, number] = result[(i + 1) % result.length].point;
      area +=
        (a[0] - centre[0]) * (b[1] - centre[1]) -
        (a[1] - centre[1]) * (b[0] - centre[0]);
    }
    if (!(area > 0) || !Number.isFinite(area))
      throw new Error("unsupported-support-section: unresolved signed area");
    return result;
  };
}
