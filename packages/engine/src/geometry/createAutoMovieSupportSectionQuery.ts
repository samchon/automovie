import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";

/**
 * Prepare fixed half-plane directions for independent changing-offset queries.
 * Copy the admitted finite unit normals and compute every exact nonparallel pair
 * once. A successful polygon supplies only a cyclic active-edge seed. Its next
 * intersections must satisfy every current inequality before that seed can be
 * reused; otherwise full pair enumeration replaces it. Bounded active normals
 * and feasible cyclic corners prove the seed polygon equals the intersection.
 * Every tight nonparallel pair still receives the weak-direction check.
 * A conservative fixed-normal range certificate admits lazy coordinates only
 * when every pair is finite; uncertified offsets retain full preflight.
 * Offsets and output vertices are never cached or shared between queries.
 * Callers bound the plane population and supply bounded section charts.
 *
 * @evidence contracts/common.md#principled-implementation Fixed normal-pair determinants are invariant under changing offsets. A bounded cyclic active-edge intersection whose corners satisfy every half-plane equals the complete intersection, so that certificate permits coherent queries without enumerating rejected corners. Failed certificates use full enumeration; all exact tight incidences and feasible weak pairs remain checked.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine preparation owner serves repeated physical sections in inverse fitting and continuous planning; the existing one-shot query delegates to it without a second implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No offset result, coordinate weld, source geometry or specimen condition supplies an intersection. Cached combinatorics are never accepted without all-plane feasibility, and every tight weak pair refuses even when absent from the seed. Copied directions cannot change through the caller's arrays.
 * @evidence contracts/common.md#meaningful-documentation States admitted unit/chart premises, copied direction ownership, cyclic certificate and fallback, offset independence, deferred weak refusal and caller-owned preparation lifetime.
 * @evidence contracts/performance.md#efficient-algorithms For P bounded planes, preparation costs and retains O(P squared) pair records and a fixed-normal finite-coordinate bound. Certified offsets compute only demanded coordinates; uncertified offsets retain O(P squared) full preflight. A valid A-corner seed checks O(A P) inequalities plus its exact tight-pair incidences, while a failed seed costs O(P cubed) full enumeration. Query scratch is O(P squared); every demanded coordinate is computed at most once per offset set.
 * @evidence contracts/performance.md#reuse-equivalent-work One caller-owned query reuses copied normals, exact nonparallel determinants, their conservative range bound, a numeric plane-pair index matrix and only the previous successful polygon's cyclic edge-pair indices. Current offsets must satisfy the range bound or receive full coordinate preflight, and every reused corner must prove current all-plane feasibility. The bound changes scheduling, not admission or arithmetic. Failure replaces the seed only after a successful full result; returned coordinates/incidence are fresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned CPU closure retains O(P squared) fixed direction records and at most P active-edge pair indices until released. Each query discards its coordinates/maps and transfers fresh vertices; no offsets, image, file, worker or global input-dependent cache is retained.
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
  const pairIndices: (number | undefined)[][] = Array.from(
    { length: normals.length },
    (): (number | undefined)[] => new Array(normals.length),
  );
  for (let index: number = 0; index < pairs.length; index++)
    pairIndices[pairs[index].i][pairs[index].j] = index;
  const normalScale: number = Math.max(
    1,
    ...normals.flatMap((normal: [number, number]): number[] =>
      normal.map(Math.abs),
    ),
  );
  // If |h| <= (MAX / 16 / C) min(1, |d|), both products, their
  // difference and division by d remain finite with rounding headroom.
  // An unprovable bound merely falls back to the original full preflight.
  const finiteOffsetLimit: number = pairs.reduce(
    (limit: number, pair: (typeof pairs)[number]): number =>
      Math.min(
        limit,
        (Number.MAX_VALUE / 16 / normalScale) *
          Math.min(1, Math.abs(pair.determinant)),
      ),
    Number.MAX_VALUE,
  );
  let previous: number[] | undefined;
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
    const coordinates: Float64Array = new Float64Array(2 * pairs.length);
    const computed: Uint8Array = new Uint8Array(pairs.length);
    const coordinate: (index: number) => void = (index: number): void => {
      if (computed[index]) return;
      const pair: (typeof pairs)[number] = pairs[index];
      const a: readonly [number, number] = normals[pair.i],
        b: readonly [number, number] = normals[pair.j];
      const x: number =
        (offsets[pair.i] * b[1] - a[1] * offsets[pair.j]) / pair.determinant;
      const z: number =
        (a[0] * offsets[pair.j] - offsets[pair.i] * b[0]) / pair.determinant;
      if (!Number.isFinite(x) || !Number.isFinite(z))
        throw new Error(
          "nonfinite-support-intersection: chart exceeds binary64 coordinates",
        );
      coordinates[2 * index] = x;
      coordinates[2 * index + 1] = z;
      computed[index] = 1;
    };
    if (!(finiteOffsetLimit > 0 && scale <= finiteOffsetLimit))
      for (let index: number = 0; index < pairs.length; index++)
        coordinate(index);
    const evaluate: (
      index: number,
    ) =>
      | { pair: [number, number]; tight: number[]; point: [number, number] }
      | undefined = (
      index: number,
    ):
      | { pair: [number, number]; tight: number[]; point: [number, number] }
      | undefined => {
      coordinate(index);
      const pair: (typeof pairs)[number] = pairs[index];
      const i: number = pair.i,
        j: number = pair.j,
        determinant: number = pair.determinant;
      const a: readonly [number, number] = normals[i],
        b: readonly [number, number] = normals[j];
      const x: number = coordinates[2 * index],
        z: number = coordinates[2 * index + 1];
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
      if (!feasible) return undefined;
      tight ??= [i, j];
      tight.sort((a: number, b: number): number => a - b);
      let canonical: number = index;
      for (let first: number = 0; first < tight.length; first++)
        for (let second: number = first + 1; second < tight.length; second++) {
          const candidate: number | undefined =
            pairIndices[tight[first]][tight[second]];
          if (candidate === undefined) continue;
          if (Math.abs(pairs[candidate].determinant) < minimumDirectionSine)
            throw new Error(
              "weak-support-boundary: feasible plane pair is unresolved",
            );
          canonical = Math.min(canonical, candidate);
        }
      coordinate(canonical);
      return {
        pair: [pairs[canonical].i, pairs[canonical].j],
        tight,
        point: [coordinates[2 * canonical], coordinates[2 * canonical + 1]],
      };
    };
    let seedFeasible: boolean = previous !== undefined;
    if (previous)
      for (const index of previous) {
        const vertex: ReturnType<typeof evaluate> = evaluate(index);
        if (vertex === undefined) {
          seedFeasible = false;
          break;
        }
        vertices.set(vertex.tight.join(":"), vertex);
      }
    if (!seedFeasible || vertices.size < 3) {
      seedFeasible = false;
      vertices.clear();
      for (let index: number = 0; index < pairs.length; index++) {
        const vertex: ReturnType<typeof evaluate> = evaluate(index);
        if (vertex !== undefined) vertices.set(vertex.tight.join(":"), vertex);
      }
    }
    const result: ReturnType<
      ReturnType<typeof createAutoMovieSupportSectionQuery>
    > = [...vertices.values()].sort(
      (a: (typeof result)[number], b: (typeof result)[number]): number =>
        pairIndices[a.pair[0]][a.pair[1]]! - pairIndices[b.pair[0]][b.pair[1]]!,
    );
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
    // With distinct feasible corners, the same bounded cyclic edge system still
    // owns the polygon. Only a collapse or full search requires a new seed.
    if (seedFeasible && result.length === previous!.length) return result;
    const faces: (number | undefined)[] = result.map(
      (vertex: (typeof result)[number], index: number): number | undefined =>
        vertex.tight.find((plane: number): boolean =>
          result[(index + 1) % result.length].tight.includes(plane),
        ),
    );
    const seed: (number | undefined)[] = faces.map(
      (face: number | undefined, index: number): number | undefined => {
        const before: number | undefined =
          faces[(index + faces.length - 1) % faces.length];
        return before === undefined || face === undefined
          ? undefined
          : pairIndices[Math.min(before, face)][Math.max(before, face)];
      },
    );
    const angles: number[] = faces
      .filter((face: number | undefined): face is number => face !== undefined)
      .map((face: number): number =>
        Math.atan2(normals[face][1], normals[face][0]),
      )
      .sort((a: number, b: number): number => a - b);
    const bounded: boolean = angles.every(
      (angle: number, index: number): boolean =>
        (index + 1 === angles.length
          ? angles[0] + 2 * Math.PI
          : angles[index + 1]) -
          angle <
        Math.PI,
    );
    previous =
      bounded &&
      seed.every(
        (index: number | undefined): index is number => index !== undefined,
      )
        ? seed
        : undefined;
    return result;
  };
}
