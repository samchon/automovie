import { TestValidator } from "@nestia/e2e";

import { AutoMovieLocalHermiteField64 } from "../../../../packages/engine/src/geometry/curve/AutoMovieLocalHermiteField64";
import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { tessellateAutoMovieCurveGrid64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieCurveGrid64";
import { tessellateAutoMovieLocalHermite64 as Stream } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieLocalHermite64";
import { nclose } from "../internal/nclose";

/** Exact real-arithmetic half restrictions, formed independently of the field and tessellator. */
const halve: (span: C.Span) => [C.Span, C.Span] = (
  span: C.Span,
): [C.Span, C.Span] => {
  const mean: (a: C.Vector, b: C.Vector) => C.Vector = (
    a: C.Vector,
    b: C.Vector,
  ): C.Vector => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const a: C.Vector = mean(span[0], span[1]),
    b: C.Vector = mean(span[1], span[2]),
    c: C.Vector = mean(span[2], span[3]);
  const d: C.Vector = mean(a, b),
    e: C.Vector = mean(b, c),
    middle: C.Vector = mean(d, e);
  return [
    [span[0], a, d, middle],
    [middle, e, c, span[3]],
  ];
};

/** Read geometric faces and actual shared indices, without consuming analytic normal attributes. */
const translatedStrip: (
  positions: readonly number[],
  indices: readonly number[],
  radiusM: number,
  gapM: number,
) => {
  finite: boolean;
  flatAlongStation: boolean;
  oriented: boolean;
  conforming: boolean;
  middleEdges: number;
  areaMatchesBoundary: boolean;
  maximumStationNormal: number;
} = (
  positions: readonly number[],
  indices: readonly number[],
  radiusM: number,
  gapM: number,
): {
  finite: boolean;
  flatAlongStation: boolean;
  oriented: boolean;
  conforming: boolean;
  middleEdges: number;
  areaMatchesBoundary: boolean;
  maximumStationNormal: number;
} => {
  const gamma: number = (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);
  // The squared transverse diameter scales a gamma(64) allowance for the bounded
  // rounding path of nested cubic evaluation and the station determinant.
  const determinantAllowance: number = gamma * (2 * radiusM) ** 2;
  const at: (value: number, station: number) => boolean = (
    value: number,
    station: number,
  ): boolean => nclose(value, station, gamma * gapM);
  const point: (id: number) => number[] = (id: number): number[] =>
    positions.slice(id * 3, id * 3 + 3);
  const edges: Map<
    string,
    { a: number; b: number; uses: number; direction: number }
  > = new Map();
  let finite: boolean = indices.length > 0 && positions.every(Number.isFinite),
    flatAlongStation: boolean = true,
    oriented: boolean = true,
    area: number = 0,
    maximumStationNormal: number = 0;
  for (let i: number = 0; i < indices.length; i += 3) {
    const ids: number[] = indices.slice(i, i + 3);
    if (
      !ids.every(
        (id: number): boolean =>
          Number.isSafeInteger(id) && id >= 0 && id < positions.length / 3,
      )
    ) {
      finite = false;
      continue;
    }
    const p: number[][] = ids.map(point),
      a: number[] = p[1]!.map(
        (value: number, k: number): number => value - p[0]![k]!,
      ),
      b: number[] = p[2]!.map(
        (value: number, k: number): number => value - p[0]![k]!,
      );
    const n: number[] = [
        a[1]! * b[2]! - a[2]! * b[1]!,
        a[2]! * b[0]! - a[0]! * b[2]!,
        a[0]! * b[1]! - a[1]! * b[0]!,
      ],
      length: number = Math.hypot(...n);
    finite &&= Number.isFinite(length) && length > 0;
    flatAlongStation &&= Math.abs(n[1]!) <= determinantAllowance;
    oriented &&=
      n[0]! * (p[0]![0]! + p[1]![0]! + p[2]![0]!) +
        n[2]! * (p[0]![2]! + p[1]![2]! + p[2]![2]!) <
      0;
    area += length / 2;
    maximumStationNormal = Math.max(
      maximumStationNormal,
      Math.abs(n[1]!) / length,
    );
    for (let k: number = 0; k < 3; k++) {
      const a: number = ids[k]!,
        b: number = ids[(k + 1) % 3]!,
        key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
      const edge: { a: number; b: number; uses: number; direction: number } =
        edges.get(key) ?? { a, b, uses: 0, direction: 0 };
      edge.uses++;
      edge.direction += a < b ? 1 : -1;
      edges.set(key, edge);
    }
  }
  let conforming: boolean = true,
    middleEdges: number = 0,
    bottomLength: number = 0;
  for (const edge of edges.values()) {
    const a: number[] = point(edge.a),
      b: number[] = point(edge.b);
    const bottom: boolean = at(a[1]!, 0) && at(b[1]!, 0),
      top: boolean = at(a[1]!, 2 * gapM) && at(b[1]!, 2 * gapM);
    const end: boolean = [
      [radiusM, 0],
      [0, radiusM],
    ].some(([x, z]: number[]): boolean =>
      [a, b].every(
        (p: number[]): boolean =>
          nclose(p[0]!, x!, gamma * radiusM) &&
          nclose(p[2]!, z!, gamma * radiusM),
      ),
    );
    if (edge.uses === 1) conforming &&= bottom || top || end;
    else conforming &&= edge.uses === 2 && edge.direction === 0;
    if (edge.uses === 1 && bottom)
      bottomLength += Math.hypot(a[0]! - b[0]!, a[2]! - b[2]!);
    if (at(a[1]!, gapM) && at(b[1]!, gapM)) {
      middleEdges++;
      conforming &&= edge.uses === 2 && edge.direction === 0;
    }
  }
  const expected: number = bottomLength * 2 * gapM;
  return {
    finite,
    flatAlongStation,
    oriented,
    conforming,
    middleEdges,
    areaMatchesBoundary:
      expected > 0 &&
      nclose(area, expected, gamma * indices.length * Math.max(area, expected)),
    maximumStationNormal,
  };
};

/**
 * Open polynomial consumers use one resolvable normalized partition convention.
 * Scenarios:
 * 1. Ten thousand equal spans retain a complete unit chart despite accumulated sum roundoff.
 * 2. Local station values and physical derivatives agree with an affine independent formula.
 * 3. The grid retains the same endpoint, metre scale and finite output on that partition.
 * 4. A genuinely short chart, a collapsed canonical final interval and nonincreasing stations refuse.
 * 5. Quadratic interpolation reproduces a physical-station quadratic at nonuniform stations.
 * 6. Identical translated quarter cubics have station-parallel generated face planes under ruled and quadratic interpolation, gaps 1 and 0.0001 mm, coarse/fine position requests and powers-of-two scaling. A half-restricted middle course preserves both station and phase boundary indices across small streamed chunks.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Hermite field preparation, station jets, analytic interval construction, grid tessellation and the actual local streaming tessellator. Assertions observe values, physical derivatives, normalized endpoints, refusal, emitted face determinants, shared indexed boundaries, global chunk ownership and retained geometry. Every translation regime executes before its results are asserted, and normal attributes cannot hide an incorrect face plane.
 * @evidence contracts/testing.md#independent-expectations Cubic degree elevation gives P(u,s)=(u,s,0), derivative (0,1,0) and metre conversion; P(u,s)=(u,s,s²) gives (0,1,2s). For translated P(u,s)=(x(u),s,z(u)), conforming extruded polygon triangles have zero station-normal component and area equal to the bottom polygon length times station height. A gamma(64) binary64 determinant allowance scales with squared transverse diameter, not an angle. Direct half-restriction formulas and the explicit Bernstein midpoint identify the shared source knot. Equal 1/n widths follow the common sum-roundoff convention. These cases establish no arbitrary correspondence, surface fidelity or appearance.
 * @evidence contracts/testing.md#distinguishing-cases Covers a long uniform partition, physical endpoints and interior phase, nonuniform quadratic stations, incomplete/collapsed phase charts and duplicate stations. Curved translation covers two interpolation modes, small gaps, coarse requests, two scales, unequal exact phase partitions, shared middle indices, append-only chunk offsets and immutable input. LocalHermite admits open courses; periodic chart closure belongs to the atlas realization companion.
 * @evidence contracts/testing.md#execution-ownership This named portable test imports engine source and creates affine, quadratic and translated quarter-cubic courses only. It drains each in-process generator and owns every case without a Human fixture, consumer installation, foreign-method replacement, process, browser, GPU or native build.
 */
export function test_geometry_local_hermite_partition(): void {
  const count: number = 10000;
  const course: (station: number) => C.Cubic = (station: number): C.Cubic => ({
    type: "cubicBezier",
    name: `affine-${station}`,
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: Array.from({ length: count }, (): number => 1 / count),
    spans: Array.from(
      { length: count },
      (_: unknown, i: number): C.Span => [
        [i / count, station, 0],
        [(i + 1 / 3) / count, station, 0],
        [(i + 2 / 3) / count, station, 0],
        [(i + 1) / count, station, 0],
      ],
    ),
  });
  const courses: C.Cubic[] = [course(0), course(3)];
  const field: AutoMovieLocalHermiteField64.Prepared =
    AutoMovieLocalHermiteField64.prepare([0, 3], courses, "ruled");
  for (const station of [0, 1])
    for (const phase of [0, 0.25, 1]) {
      const jet: AutoMovieLocalHermiteField64.Jet = field.station(
        station,
        phase,
      );
      TestValidator.predicate(
        "affine station value",
        nclose(jet.position[0], phase, 1e-10) &&
          nclose(jet.position[1], station * 3) &&
          nclose(jet.position[2], 0),
      );
      TestValidator.predicate(
        "physical station derivative",
        nclose(jet.stationPartial[0], 0) &&
          nclose(jet.stationPartial[1], 1) &&
          nclose(jet.stationPartial[2], 0),
      );
    }
  const grid: ReturnType<typeof tessellateAutoMovieCurveGrid64> =
    tessellateAutoMovieCurveGrid64({
      name: "partition",
      topologyDomain: "general-affine-partition",
      stations: [0, 3],
      courses,
      resolutionMm: 100,
      guides: [],
      maxVertices: 50000,
    });
  TestValidator.predicate(
    "grid normalized endpoint",
    nclose(grid.parameters.course.at(-1)!, 1, 1e-15),
  );
  TestValidator.predicate(
    "grid output is finite",
    grid.mesh.positions.length > 0 &&
      grid.mesh.positions.every(Number.isFinite),
  );
  TestValidator.predicate(
    "grid endpoint in metres",
    nclose(grid.boundaries.stationLast.positions.at(-1)![0], 0.001, 1e-12) &&
      nclose(grid.boundaries.stationLast.positions.at(-1)![1], 0.003, 1e-12),
  );
  const refuses: (stations: number[], input: C.Cubic[]) => boolean = (
    stations: number[],
    input: C.Cubic[],
  ): boolean => {
    try {
      AutoMovieLocalHermiteField64.prepare(stations, input);
      return false;
    } catch (error) {
      return error instanceof Error;
    }
  };
  const short: C.Cubic = {
    ...courses[0]!,
    phaseIntervals: courses[0]!.phaseIntervals.map(
      (width: number): number => width * 0.9,
    ),
  };
  TestValidator.predicate(
    "short chart refuses",
    refuses([0, 3], [short, courses[1]!]),
  );
  const collapsed: C.Cubic = {
    ...courses[0]!,
    spans: [courses[0]!.spans[0]!, courses[0]!.spans[1]!],
    phaseIntervals: [1, Number.EPSILON],
  };
  TestValidator.predicate(
    "canonical final interval refuses",
    refuses([0, 3], [collapsed, courses[1]!]),
  );
  TestValidator.predicate(
    "duplicate physical station refuses",
    refuses([0, 0], courses),
  );
  const stations: number[] = [0, 2, 5];
  const quadratic: C.Cubic[] = stations.map(
    (s: number): C.Cubic => ({
      type: "cubicBezier",
      name: `quadratic-${s}`,
      closed: false,
      unit: "mm",
      phaseUnit: "normalized",
      phaseIntervals: [1],
      spans: [
        [
          [0, s, s * s],
          [1 / 3, s, s * s],
          [2 / 3, s, s * s],
          [1, s, s * s],
        ],
      ],
    }),
  );
  const physical: AutoMovieLocalHermiteField64.Prepared =
    AutoMovieLocalHermiteField64.prepare(stations, quadratic);
  for (let i: number = 0; i < stations.length; i++) {
    const jet: AutoMovieLocalHermiteField64.Jet = physical.station(i, 0.5);
    TestValidator.predicate(
      "nonuniform quadratic physical derivative",
      nclose(jet.stationPartial[0], 0) &&
        nclose(jet.stationPartial[1], 1) &&
        nclose(jet.stationPartial[2], 2 * stations[i]!, 1e-12),
    );
  }
  for (let i: number = 0; i < stations.length - 1; i++) {
    const cell: AutoMovieLocalHermiteField64.Cell = physical.interval(i)[0]!;
    // A cubic Bernstein row evaluates at t=1/2 with weights 1,3,3,1 over eight.
    const weights: number[] = [1 / 8, 3 / 8, 3 / 8, 1 / 8];
    const z: number = cell.grid.reduce(
      (sum: number, row: number[][], r: number): number =>
        sum + weights[r]! * row[0]![2]!,
      0,
    );
    const middle: number = (stations[i]! + stations[i + 1]!) / 2;
    TestValidator.predicate(
      "nonuniform quadratic interval value",
      nclose(z, middle * middle, 1e-12),
    );
  }

  const observations: {
    scale: number;
    gapMm: number;
    toleranceMm: number;
    interpolation: "ruled" | "quadratic";
    complete: boolean;
    immutable: boolean;
    appendOnly: boolean;
    identities: boolean;
    phaseJoined: boolean;
    faces?: ReturnType<typeof translatedStrip>;
    failure?: string;
  }[] = [];
  for (const scale of [1, 2 ** -8, 2 ** 8])
    for (const gap of [1, 0.0001])
      for (const tolerance of [0.05, 0.5])
        for (const interpolation of ["ruled", "quadratic"] as const) {
          const height: number = gap * scale,
            k: number = (4 / 3) * Math.tan(Math.PI / 8),
            radiusM: number = scale * 0.001;
          const source: C.Cubic[] = [0, height, 2 * height].map(
            (station: number, i: number): C.Cubic => {
              const span: C.Span = [
                [scale, station, 0],
                [scale, station, k * scale],
                [k * scale, station, scale],
                [0, station, scale],
              ];
              return {
                type: "cubicBezier",
                name: `translated-${i}`,
                closed: false,
                unit: "mm",
                phaseUnit: "normalized",
                spans: i === 1 ? halve(span) : [span],
                phaseIntervals: i === 1 ? [0.5, 0.5] : [1],
              };
            },
          );
          const snapshot: string = JSON.stringify(source),
            positions: number[] = [],
            indices: number[] = [],
            identities: string[] = [],
            intervalTriangles: [number, number] = [0, 0];
          const offset: number = 11;
          const record: (typeof observations)[number] = {
            scale,
            gapMm: height,
            toleranceMm: tolerance * scale,
            interpolation,
            complete: false,
            immutable: false,
            appendOnly: true,
            identities: false,
            phaseJoined: false,
          };
          const iterator: ReturnType<typeof Stream> = Stream({
            name: "translated-quarter",
            topologyDomain: "general-translated-quarter",
            stations: [0, height, 2 * height],
            courses: source,
            stationInterpolation: interpolation,
            toleranceMm: tolerance * scale,
            maxCellsPerInterval: 2048,
            maxVerticesPerChunk: 7,
            vertexOffset: offset,
          });
          try {
            let next: ReturnType<typeof iterator.next> = iterator.next();
            let omitted: number = 0;
            while (!next.done) {
              const chunk: Stream.Chunk = next.value;
              record.appendOnly &&=
                chunk.vertexStart === offset + positions.length / 3 &&
                chunk.positions.length === chunk.normals.length &&
                chunk.positions.length / 3 === chunk.physicalVertexIds.length &&
                chunk.positions.every(Number.isFinite) &&
                chunk.normals.every(Number.isFinite) &&
                chunk.indices.every(
                  (id: number): boolean =>
                    Number.isSafeInteger(id) &&
                    id >= offset &&
                    id < chunk.vertexStart + chunk.positions.length / 3,
                );
              positions.push(...chunk.positions);
              indices.push(
                ...chunk.indices.map((id: number): number => id - offset),
              );
              identities.push(...chunk.physicalVertexIds);
              intervalTriangles[chunk.interval]! += chunk.indices.length / 3;
              omitted += chunk.counts.omittedZeroAreaTriangles;
              next = iterator.next();
            }
            record.complete =
              next.value.omittedIntervals === 0 &&
              intervalTriangles.every((count: number): boolean => count > 0) &&
              omitted === 0;
            record.immutable = JSON.stringify(source) === snapshot;
            record.identities = new Set(identities).size === identities.length;
            const middle: number = (0.5 + 0.375 * k) * radiusM,
              allowance: number =
                (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);
            let matches: number = 0;
            for (let i: number = 0; i < positions.length; i += 3)
              if (
                nclose(positions[i]!, middle, allowance * radiusM) &&
                nclose(
                  positions[i + 1]!,
                  height * 0.001,
                  allowance * height * 0.001,
                ) &&
                nclose(positions[i + 2]!, middle, allowance * radiusM)
              )
                matches++;
            record.phaseJoined = matches === 1;
            record.faces = translatedStrip(
              positions,
              indices,
              radiusM,
              height * 0.001,
            );
          } catch (failure: unknown) {
            record.failure =
              failure instanceof Error ? failure.message : String(failure);
          } finally {
            iterator.return({
              intervals: 0,
              omittedIntervals: 0,
              vertices: 0,
              triangles: 0,
              diagnostics: [],
            });
          }
          observations.push(record);
        }
  console.log(
    JSON.stringify({
      schema: "generic-local-hermite-translated-face-regression-v1",
      observations,
    }),
  );
  for (const record of observations) {
    TestValidator.predicate(
      "translated Hermite intervals retain complete immutable append-only geometry",
      record.failure === undefined &&
        record.complete &&
        record.immutable &&
        record.appendOnly &&
        record.identities &&
        record.faces?.finite === true,
    );
    TestValidator.predicate(
      "translated Hermite face planes introduce no station-axis tilt",
      record.faces?.flatAlongStation === true,
    );
    TestValidator.predicate(
      "translated Hermite faces retain orientation and extrusion area",
      record.faces?.oriented === true && record.faces.areaMatchesBoundary,
    );
    TestValidator.predicate(
      "station and restricted phase boundaries retain one shared index",
      record.phaseJoined &&
        record.faces?.conforming === true &&
        record.faces.middleEdges > 0,
    );
  }
}
