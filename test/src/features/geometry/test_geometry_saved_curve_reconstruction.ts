import {
  type IAutoMovieCurve64 as C,
  AutoMovieLocalHermiteField64 as H,
  tessellateAutoMovieLocalHermite64 as tessellate,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Saved polynomial courses generate a physically scaled field and one indexed stream.
 * This portable mathematical regression uses synthetic millimetre curves only.
 * It does not load an original asset, invoke observation tools or establish embedding.
 *
 * Scenarios:
 * 1. Nonuniform courses and reversed phases reproduce a physical polynomial.
 * 2. Two-course ruled interpolation preserves its secant and refuses duplicate stations.
 * 3. Different chunk capacities retain the same finite geometry and shared station incidence.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the prepared quadratic/ruled field and actual streaming tessellator, checking physical derivatives, reversed course direction, unequal course partitions, metre output, shared station indices and retained bounded chunks.
 * @evidence contracts/testing.md#independent-expectations The exact field X=u,Y=s,Z=s*s/100 supplies values and derivatives; direct degree-three Bernstein weights independently evaluate returned coefficients. Index incidence and opposing edge orientation derive from a rectangular sheet's topology, not a generated snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Nonuniform stations, unequal but equivalent course partitions, forward/reversed phase and quadratic versus two-course ruled interpolation contrast duplicate stations. Two chunk capacities must preserve the same complete positions and indices, including vertices referenced from earlier chunks.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_geometry_saved_curve_reconstruction; this function owns every assertion and invokes no filesystem, process, source mesh, browser, GPU or native artifact build.
 */
export function test_geometry_saved_curve_reconstruction(): void {
  /** Exact linear-in-course sections of the independently specified polynomial. */
  const stations: number[] = [0, 2, 7, 11];
  const course: (s: number, divided: boolean, reverse: boolean) => C.Cubic = (
    s: number,
    divided: boolean,
    reverse: boolean,
  ): C.Cubic => {
    const cuts: number[] = divided ? [0, 0.25, 1] : [0, 1];
    const spans: C.Span[] = cuts
      .slice(0, -1)
      .map((start: number, j: number): C.Span => {
        const end: number = cuts[j + 1]!;
        const point: (i: number) => C.Vector = (i: number): C.Vector => {
          const u: number = start + ((end - start) * i) / 3;
          return [reverse ? 1 - u : u, s, (s * s) / 100];
        };
        return [point(0), point(1), point(2), point(3)];
      });
    return {
      type: "cubicBezier",
      name: `polynomial.${s}`,
      closed: false,
      unit: "mm",
      phaseUnit: "normalized",
      spans,
      phaseIntervals: cuts
        .slice(1)
        .map((end: number, i: number): number => end - cuts[i]!),
    };
  };
  /** Independent polynomial weights, rather than engine coefficient evaluators. */
  const basis: (t: number) => number[] = (t: number): number[] => [
    (1 - t) ** 3,
    3 * t * (1 - t) ** 2,
    3 * t * t * (1 - t),
    t ** 3,
  ];
  const residual: (
    actual: readonly number[],
    expected: readonly number[],
  ) => number = (
    actual: readonly number[],
    expected: readonly number[],
  ): number =>
    Math.max(
      ...actual.map((value: number, i: number): number =>
        Math.abs(value - expected[i]!),
      ),
    );
  let maximum: number = 0;
  for (const reverse of [false, true]) {
    const courses: C.Cubic[] = stations.map(
      (s: number, i: number): C.Cubic => course(s, i % 2 === 1, reverse),
    );
    const original: string = JSON.stringify([stations, courses]);
    const field: H.Prepared = H.prepare(stations, courses, "quadratic");
    for (let j: number = 0; j < stations.length; j++)
      for (const u of [0, 0.125, 0.25, 0.6, 1]) {
        const s: number = stations[j]!,
          jet: H.Jet = field.station(j, u);
        maximum = Math.max(
          maximum,
          residual(jet.position, [reverse ? 1 - u : u, s, (s * s) / 100]),
          residual(jet.coursePartial, [reverse ? -1 : 1, 0, 0]),
          residual(jet.stationPartial, [0, 1, s / 50]),
        );
      }
    for (let j: number = 0; j + 1 < stations.length; j++)
      for (const cell of field.interval(j))
        for (const u of [0, 0.35, 1])
          for (const v of [0, 0.4, 1]) {
            const wu: number[] = basis(u),
              wv: number[] = basis(v),
              point: number[] = [0, 0, 0];
            for (let r: number = 0; r < 4; r++)
              for (let c: number = 0; c < 4; c++)
                for (let k: number = 0; k < 3; k++)
                  point[k] += wu[c]! * wv[r]! * cell.grid[r]![c]![k]!;
            const phase: number = cell.u0 + (cell.u1 - cell.u0) * u,
              s: number = stations[j]! + (stations[j + 1]! - stations[j]!) * v;
            maximum = Math.max(
              maximum,
              residual(point, [reverse ? 1 - phase : phase, s, (s * s) / 100]),
            );
          }
    TestValidator.equals(
      "field leaves original courses and stations immutable",
      JSON.stringify([stations, courses]),
      original,
    );
  }
  TestValidator.predicate(
    "nonuniform physical quadratic field and reversal match an independent polynomial",
    nclose(maximum, 0, 1e-11),
  );
  const ruled: H.Prepared = H.prepare(
    [0, 3],
    [course(0, false, false), course(3, true, false)],
    "ruled",
  );
  for (const j of [0, 1])
    TestValidator.predicate(
      "two-course ruled transverse derivative is the physical secant",
      nclose(
        residual(ruled.station(j, 0.4).stationPartial, [0, 1, 0.03]),
        0,
        1e-12,
      ),
    );
  let refused: boolean = false;
  try {
    H.prepare([0, 0], [course(0, false, false), course(0, false, false)]);
  } catch {
    refused = true;
  }
  TestValidator.predicate(
    "duplicate physical stations are rejected without perturbation",
    refused,
  );

  /** Collect only the engine's append-only suffixes, retaining actual global indices. */
  const collect: (capacity: number) => {
    positions: number[];
    normals: number[];
    identities: string[];
    indices: number[];
    intervals: number[];
    omitted: number;
    chunks: number;
  } = (
    capacity: number,
  ): {
    positions: number[];
    normals: number[];
    identities: string[];
    indices: number[];
    intervals: number[];
    omitted: number;
    chunks: number;
  } => {
    const positions: number[] = [],
      normals: number[] = [],
      identities: string[] = [],
      indices: number[] = [],
      intervals: number[] = [];
    const courses: C.Cubic[] = stations.map(
      (s: number, i: number): C.Cubic => course(s, i % 2 === 1, false),
    );
    const generator: ReturnType<typeof tessellate> = tessellate({
      name: "polynomial.sheet",
      topologyDomain: "polynomial.sheet",
      stations,
      courses,
      stationInterpolation: "ruled",
      toleranceMm: 0.1,
      maxCellsPerInterval: 512,
      maxVerticesPerChunk: capacity,
    });
    let next: ReturnType<typeof generator.next> = generator.next(),
      chunks: number = 0;
    while (!next.done) {
      const chunk: tessellate.Chunk = next.value;
      TestValidator.equals(
        "stream appends one global vertex suffix",
        chunk.vertexStart,
        positions.length / 3,
      );
      TestValidator.predicate(
        "chunk capacity and analytic normals remain finite",
        chunk.positions.length / 3 <= capacity &&
          chunk.normals.length === chunk.positions.length &&
          chunk.normals.every(Number.isFinite),
      );
      positions.push(...chunk.positions);
      normals.push(...chunk.normals);
      identities.push(...chunk.physicalVertexIds);
      indices.push(...chunk.indices);
      for (let i: number = 0; i < chunk.indices.length / 3; i++)
        intervals.push(chunk.interval);
      chunks++;
      next = generator.next();
    }
    return {
      positions,
      normals,
      identities,
      indices,
      intervals,
      omitted: next.value.omittedIntervals,
      chunks,
    };
  };
  const small: ReturnType<typeof collect> = collect(3),
    large: ReturnType<typeof collect> = collect(19);
  TestValidator.predicate(
    "chunk capacity preserves finite positions and analytic normals exactly",
    small.positions.length === large.positions.length &&
      small.normals.length === large.normals.length &&
      small.positions.every((value: number, i: number): boolean =>
        nclose(value, large.positions[i]!, 0),
      ) &&
      small.normals.every((value: number, i: number): boolean =>
        nclose(value, large.normals[i]!, 0),
      ),
  );
  TestValidator.equals(
    "chunk capacity preserves logical identities and integer incidence",
    { identities: small.identities, indices: small.indices },
    { identities: large.identities, indices: large.indices },
  );
  TestValidator.predicate(
    "both capacities retain complete geometry",
    small.omitted === 0 &&
      large.omitted === 0 &&
      small.chunks > large.chunks &&
      small.indices.length > 0,
  );
  const owners: Map<string, number> = new Map();
  for (let i: number = 0; i < small.identities.length; i++) {
    TestValidator.predicate(
      "one physical station vertex has one raw index",
      !owners.has(small.identities[i]!),
    );
    owners.set(small.identities[i]!, i);
    const y: number = small.positions[3 * i + 1]!;
    if (stations.some((s: number): boolean => y === s * 0.001)) {
      const s: number = y * 1000,
        u: number = small.positions[3 * i]! * 1000;
      TestValidator.predicate(
        "saved station geometry is published in metres",
        residual(
          [small.positions[3 * i]!, y, small.positions[3 * i + 2]!],
          [u * 0.001, s * 0.001, ((s * s) / 100) * 0.001],
        ) < 1e-14,
      );
    }
  }
  const edges: Map<
    string,
    { count: number; sense: number; intervals: Set<number> }
  > = new Map();
  for (let face: number = 0; face < small.indices.length / 3; face++)
    for (let k: number = 0; k < 3; k++) {
      const a: number = small.indices[3 * face + k]!,
        b: number = small.indices[3 * face + ((k + 1) % 3)]!;
      TestValidator.predicate(
        "global indices only name published vertices",
        a >= 0 &&
          b >= 0 &&
          a < small.positions.length / 3 &&
          b < small.positions.length / 3,
      );
      const ay: number = small.positions[3 * a + 1]!,
        by: number = small.positions[3 * b + 1]!;
      if (
        ay !== by ||
        !stations.slice(1, -1).some((s: number): boolean => ay === s * 0.001)
      )
        continue;
      const key: string = a < b ? `${a}:${b}` : `${b}:${a}`,
        edge: { count: number; sense: number; intervals: Set<number> } =
          edges.get(key) ?? { count: 0, sense: 0, intervals: new Set() };
      edge.count++;
      edge.sense += a < b ? 1 : -1;
      edge.intervals.add(small.intervals[face]!);
      edges.set(key, edge);
    }
  TestValidator.predicate(
    "shared station edges are actual opposing index incidence",
    edges.size > 0 &&
      [...edges.values()].every(
        (edge: {
          count: number;
          sense: number;
          intervals: Set<number>;
        }): boolean =>
          edge.count === 2 && edge.sense === 0 && edge.intervals.size === 2,
      ),
  );
}
