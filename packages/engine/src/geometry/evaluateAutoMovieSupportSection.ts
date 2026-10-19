import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";

/**
 * Intersect oriented unit half-planes in an admitted finite XZ chart.
 * Enumerate boundary pairs and retain intersections satisfying every inequality.
 * Tight constraints, rather than coordinate proximity, identify a common vertex.
 * A relative residual filter delegates uncertain signs to the exact-sign
 * determinant owner. Zero incidence means exact equality for the supplied
 * doubles, independently of observation uncertainty. A weak feasible pair refuses.
 * Callers supply finite dense arrays, unit normals and a bounded section.
 *
 * @evidence contracts/common.md#principled-implementation Two-by-two line intersection followed by every half-plane inequality enumerates the vertices of a bounded convex section. Tight-constraint incidence supplies canonical vertex identities, and weak feasible intersections refuse rather than replacing their determinant.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine query serves both continuous support-loft generation and recovery's comparison of fitted versus observed supports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate welding, seed box, observed polygon, mesh or specimen constant supplies an intersection. The explicit relative arithmetic bound does not become a physical error allowance.
 * @evidence contracts/common.md#meaningful-documentation States inequality sense, admitted premises, XZ winding, tight-incidence identity, weak-direction refusal and unresolved binary64 classification limits.
 * @evidence contracts/performance.md#efficient-algorithms For P planes, O(P squared) pairs each test P constraints, costing O(P cubed) time and O(P squared) candidate storage; callers bound P before queries.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each query observes its supplied offsets; no mutable section or result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a caller-owned ordered vertex list escapes; numerical scratch and incidence maps expire synchronously without a file, process or global cache.
 */
export function evaluateAutoMovieSupportSection(input: {
  normals: readonly (readonly [number, number])[];
  offsets: readonly number[];
  minimumDirectionSine: number;
}): { pair: [number, number]; tight: number[]; point: [number, number] }[] {
  const vertices: Map<
    string,
    { pair: [number, number]; tight: number[]; point: [number, number] }
  > = new Map();
  const scale: number = Math.max(...input.offsets.map(Math.abs));
  for (let i: number = 0; i < input.normals.length; i++)
    for (let j: number = i + 1; j < input.normals.length; j++) {
      const a: readonly [number, number] = input.normals[i];
      const b: readonly [number, number] = input.normals[j];
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
      if (determinant === 0) continue;
      const point: [number, number] = [
        (input.offsets[i] * b[1] - a[1] * input.offsets[j]) / determinant,
        (a[0] * input.offsets[j] - input.offsets[i] * b[0]) / determinant,
      ];
      if (!point.every(Number.isFinite))
        throw new Error(
          "nonfinite-support-intersection: chart exceeds binary64 coordinates",
        );
      const epsilon: number =
        (512 *
          Number.EPSILON *
          Math.max(scale, Math.abs(point[0]), Math.abs(point[1]))) /
        determinant ** 2;
      const tight: number[] = [i, j];
      let feasible: boolean = true;
      for (let k: number = 0; k < input.normals.length; k++) {
        if (k === i || k === j) continue;
        const residual: number =
          input.normals[k][0] * point[0] +
          input.normals[k][1] * point[1] -
          input.offsets[k];
        const sign: number =
          Math.abs(residual) > epsilon
            ? Math.sign(residual)
            : -Math.sign(determinant) *
              Math.sign(
                determinantAutoMovieMatrix3([
                  a[0],
                  a[1],
                  input.offsets[i],
                  b[0],
                  b[1],
                  input.offsets[j],
                  input.normals[k][0],
                  input.normals[k][1],
                  input.offsets[k],
                ]),
              );
        if (!Number.isFinite(residual) || sign > 0) {
          feasible = false;
          break;
        }
        if (sign === 0) tight.push(k);
      }
      if (!feasible) continue;
      if (Math.abs(determinant) < input.minimumDirectionSine)
        throw new Error(
          "weak-support-boundary: feasible plane pair is unresolved",
        );
      tight.sort((a: number, b: number): number => a - b);
      const key: string = tight.join(":");
      if (!vertices.has(key)) vertices.set(key, { pair: [i, j], tight, point });
    }
  const result: ReturnType<typeof evaluateAutoMovieSupportSection> = [
    ...vertices.values(),
  ];
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
}
