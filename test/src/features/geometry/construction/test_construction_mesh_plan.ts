import {
  AutoMovieSolidMeshPlan,
  insertAutoMovieSolidMeshPoints,
  orientAutoMovieSolidChart as orient,
  triangulateAutoMovieSolidBoundary,
} from "@automovie/engine";
import type {
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** One rectangle in the independently prescribed chart. */
type Box = readonly [number, number, number, number];

/** Desired region and its original source polygon constraints. */
interface Case {
  /** Diagnostic address. */ name: string;
  /** Source polygons, whose exact contacts intentionally share an authored ID. */ polygons: (readonly (readonly [
    number,
    number,
  ])[])[];
  /** Elementary independent area. */ area: number;
  /** Region membership, before length-unit conversion. */ keeps: (
    u: number,
    v: number,
  ) => boolean;
  /** Positive phase period for a cylinder, otherwise a plane. */ period?: number;
  /** Exact triangle count when fixed by the prescribed simple polygon topology. */ count?: number;
  /** Kept interior grid coordinates, independent of the boundary vertices. */ interior?: (readonly [
    number,
    number,
  ])[];
}

/**
 * An index plan covers contact, hole and periodic residual regions once.
 *
 * Scenarios:
 *
 * 1. A square with collinear boundary points, a collinear hole, redundant nested
 *    holes, an island with a hole and a fully removed source at three units.
 * 2. A hole sharing an outer interval or corner retains its prescribed region; no
 *    strict disjoint-ring assumption is applied to those input constraints.
 * 3. Two winding rails with unequal populations, a phase-seam hole and its
 *    three-period translation use explicit cover occurrences and original IDs.
 * 4. Every returned triangle is positive, elementary total area is unchanged,
 *    directed interior edges pair, inputs stay unchanged and outputs are
 *    owned.
 * 5. Unshared crossings, nonfinite coordinates, an unrepresentable strict centroid
 *    and an untriangulated kept band return named failures atomically.
 * 6. A point a few ulps off an unconstrained diagonal, a source constraint or a
 *    vertex is inserted with every original ID, and the near-diagonal plan
 *    joins it to all four cocircular corners; a point exactly on a source
 *    constraint is refused with its inserted chart and located triangles.
 * 7. A curve meeting a straight constraint at a grazing angle, its last vertex
 *    1e-14 off the line, still covers its square: the face is read beside
 *    another edge of the walk whose first edge has no represented corridor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the native index planner directly and inspects triangle IDs/lifts, area and incidence rather than accepting a nonthrowing search as coverage proof. Production face/grid and f1 skin remain separate tests.
 * @evidence contracts/development/testing.md#independent-expectations Rectangles give exact sum/difference areas; a polygon with eight outer and eight hole vertices has sixteen triangles. Each directed interior edge has one reverse and each unpaired edge lies on a prescribed source segment. The insertion scenarios require 2V - 6 triangles by Euler's relation for a square disk, exact positive orientation, empty closed triangles and every constraint as a side, so any valid triangulation passes and a dropped point, crossed constraint or overlap fails.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes collinear preservation, no retained interior grid, redundant constraints, domain contact, unequal winding populations, seam translation, three units and detached results. It does not claim arbitrary spiral-search completeness or measured f1 performance.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_mesh_plan, with no person generation, host, renderer, process or global replacement.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A square with collinear boundary points, a collinear hole, redundant nested).
 */
export function test_construction_mesh_plan(): void {
  const failures: string[] = [];
  const inside: (box: Box, u: number, v: number) => boolean = (
    box: Box,
    u: number,
    v: number,
  ): boolean => u > box[0] && u < box[2] && v > box[1] && v < box[3];
  const outer: Box = [0, 0, 4, 4];
  const hole: Box = [1, 1, 3, 3];
  const ring: (box: Box) => (readonly [number, number])[] = (
    box: Box,
  ): (readonly [number, number])[] => rectangle(box);
  const rail: (u: number, count: number) => (readonly [number, number])[] = (
    u: number,
    count: number,
  ): (readonly [number, number])[] =>
    Array.from(
      { length: count },
      (_: unknown, k: number): readonly [number, number] => [
        u,
        (6 * k) / count,
      ],
    );
  const cases: Case[] = [
    {
      name: "collinear square",
      polygons: [ring(outer)],
      area: 16,
      count: 6,
      keeps: (u: number, v: number): boolean => inside(outer, u, v),
    },
    {
      name: "collinear hole",
      polygons: [ring(outer), ring(hole)],
      area: 12,
      count: 16,
      keeps: (u: number, v: number): boolean =>
        inside(outer, u, v) && !inside(hole, u, v),
    },
    {
      name: "interior diagonal point",
      polygons: [ring(outer)],
      interior: [[2, 2]],
      area: 16,
      count: 8,
      keeps: (u: number, v: number): boolean => inside(outer, u, v),
    },
    {
      name: "strict interior point",
      polygons: [ring(outer)],
      interior: [[1.3, 2.1]],
      area: 16,
      count: 8,
      keeps: (u: number, v: number): boolean => inside(outer, u, v),
    },
    {
      name: "two interior points",
      polygons: [ring(outer)],
      interior: [
        [2, 2],
        [1, 1],
      ],
      area: 16,
      count: 10,
      keeps: (u: number, v: number): boolean => inside(outer, u, v),
    },
    {
      name: "redundant hole",
      polygons: [ring(outer), ring(hole), ring([1.5, 1.5, 2.5, 2.5])],
      area: 12,
      keeps: (u: number, v: number): boolean =>
        inside(outer, u, v) && !inside(hole, u, v),
    },
    {
      name: "island and hole",
      polygons: [
        ring(outer),
        ring([0.5, 0.5, 3.5, 3.5]),
        ring([1.5, 1.5, 2.5, 2.5]),
      ],
      area: 8,
      keeps: (u: number, v: number): boolean =>
        inside([0.5, 0.5, 3.5, 3.5], u, v) &&
        !inside([1.5, 1.5, 2.5, 2.5], u, v),
    },
    {
      name: "fully cut",
      polygons: [ring(outer)],
      area: 0,
      count: 0,
      keeps: (_u: number, _v: number): boolean => false,
    },
    {
      name: "domain contact",
      polygons: [ring(outer), ring([0, 1, 2, 3])],
      area: 12,
      keeps: (u: number, v: number): boolean =>
        inside(outer, u, v) && !inside([0, 1, 2, 3], u, v),
    },
    {
      name: "corner contact",
      polygons: [ring(outer), ring([0, 0, 2, 2])],
      area: 12,
      keeps: (u: number, v: number): boolean =>
        inside(outer, u, v) && !inside([0, 0, 2, 2], u, v),
    },
    {
      name: "unequal winding rails",
      polygons: [rail(1, 8), rail(3, 6)],
      area: 12,
      period: 6,
      keeps: (u: number, _v: number): boolean => u > 1 && u < 3,
    },
    {
      name: "winding interior points",
      polygons: [rail(1, 8), rail(3, 6)],
      interior: [
        [2, 0],
        [2, 1.5],
        [2, 3],
        [2, 4.5],
      ],
      area: 12,
      count: 22,
      period: 6,
      keeps: (u: number, _v: number): boolean => u > 1 && u < 3,
    },
  ];
  for (const turns of [0, 3])
    cases.push({
      name: `seam hole ${turns}`,
      polygons: [
        rail(0, 8),
        rail(4, 8),
        ring([1, turns * 6 - 0.3, 3, turns * 6 + 0.3]),
      ],
      area: 24 - 1.2,
      period: 6,
      keeps: (u: number, v: number): boolean =>
        u > 0 &&
        u < 4 &&
        !(u > 1 && u < 3 && Math.abs(v - 6 * Math.round(v / 6)) < 0.3),
    });
  for (const scale of [0.001, 1, 1000])
    for (const sample of cases) inspect(failures, sample, scale);
  const all: (u: number, v: number) => boolean = (
    _u: number,
    _v: number,
  ): boolean => true;
  refuse(
    failures,
    "unshared crossing",
    AutoMovieSolidMeshPlan.triangulate(
      new Map([
        [0, [0, 0]],
        [1, [2, 2]],
        [2, [0, 2]],
        [3, [2, 0]],
      ]),
      [
        { a: 0, b: 1, turn: 0 },
        { a: 2, b: 3, turn: 0 },
      ],
      all,
    ),
    "cross without",
  );
  refuse(
    failures,
    "strict centroid precision",
    AutoMovieSolidMeshPlan.triangulate(
      new Map([
        [0, [1, 0]],
        [1, [1 + Number.EPSILON, 0]],
        [2, [1, Number.EPSILON]],
      ]),
      [
        { a: 0, b: 1, turn: 0 },
        { a: 1, b: 2, turn: 0 },
        { a: 2, b: 0, turn: 0 },
      ],
      all,
    ),
    "strict centroid",
  );
  refuse(
    failures,
    "kept band without enough vertices",
    AutoMovieSolidMeshPlan.triangulate(
      new Map([
        [0, [0, 0]],
        [1, [1, 0]],
      ]),
      [
        { a: 0, b: 0, turn: 1 },
        { a: 1, b: 1, turn: 1 },
      ],
      (u: number, _v: number): boolean => u > 0 && u < 1,
      6,
    ),
    "kept boundary",
  );
  cavity(failures);
  outputCover(failures);
  grazing(failures);
  if (failures.length !== 0)
    throw new Error(`Native mesh plan findings:\n${failures.join("\n")}`);
}

/**
 * A point a few units of the last place off a diagonal, a source constraint or
 * a vertex is inserted where its exact signs locate it, never snapped, welded
 * or refused; a point exactly on a source constraint has no authoritative
 * subdivision and is refused with its diagnostic.
 */
function cavity(failures: string[]): void {
  const points: Map<number, readonly [number, number]> = new Map([
    [0, [0, 0]],
    [1, [4, 0]],
    [2, [4, 4]],
    [3, [0, 4]],
    [4, [1, 1 + Number.EPSILON]],
  ]);
  const boundary: IAutoMovieSolidMeshConstraints.ISegment[] = [
    { a: 0, b: 1, turn: 0 },
    { a: 1, b: 2, turn: 0 },
    { a: 2, b: 3, turn: 0 },
    { a: 3, b: 0, turn: 0 },
  ];
  const diagonal: IAutoMovieSolidMeshConstraints.ISegment[] = [
    ...boundary,
    { a: 0, b: 2, turn: 0 },
  ];
  const triangles: IAutoMovieSolidMeshPlan.ITriangle[] = [
    { vertices: [0, 1, 2], lifts: [0, 0, 0] },
    { vertices: [0, 2, 3], lifts: [0, 0, 0] },
  ];
  const all: (u: number, v: number) => boolean = (
    _u: number,
    _v: number,
  ): boolean => true;
  const before: string = JSON.stringify({
    points: [...points],
    boundary,
    triangles,
  });
  const inserted: IAutoMovieSolidMeshPlan.ITriangle[] | string =
    insertAutoMovieSolidMeshPoints(points, boundary, triangles, all);
  valid(failures, "near-diagonal insertion", points, boundary, inserted);
  if (
    typeof inserted !== "string" &&
    (inserted.length !== 4 ||
      !inserted.every((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        triangle.vertices.includes(4),
      ))
  )
    failures.push("near-diagonal cavity kept the unconstrained diagonal");

  // The square's corners are cocircular and the point lies strictly inside their circle, so the Delaunay plan joins it to all four.
  const plan: IAutoMovieSolidMeshPlan.IPlan | string =
    AutoMovieSolidMeshPlan.triangulate(
      points,
      boundary,
      (u: number, v: number): boolean => u > 0 && u < 4 && v > 0 && v < 4,
    );
  if (
    typeof plan === "string" ||
    plan.triangles.length !== 4 ||
    !plan.triangles.every(
      (triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        triangle.vertices.includes(4),
    )
  )
    failures.push(
      `near-diagonal plan did not join the point to every corner: ${JSON.stringify(plan)}`,
    );
  valid(
    failures,
    "near-constraint insertion",
    points,
    diagonal,
    insertAutoMovieSolidMeshPoints(points, diagonal, triangles, all),
  );
  const on: Map<number, readonly [number, number]> = new Map(points);
  on.set(4, [2, 2]);
  const refused: IAutoMovieSolidMeshPlan.ITriangle[] | string =
    insertAutoMovieSolidMeshPoints(on, diagonal, triangles, all);
  if (
    typeof refused !== "string" ||
    !refused.includes("authoritative source-edge subdivision")
  )
    failures.push(
      `point on a source constraint was not refused by name: ${JSON.stringify(refused)}`,
    );
  else insertionDiagnostic(failures, refused, 4, [2, 2]);
  const nearVertex: Map<number, readonly [number, number]> = new Map([
    [0, [0, 0]],
    [1, [2, 0]],
    [2, [2, 2]],
    [3, [0, 2]],
    [4, [1, 1]],
    [5, [1, 1 + Number.EPSILON]],
  ]);
  const fan: IAutoMovieSolidMeshPlan.ITriangle[] = [0, 1, 2, 3].map(
    (id: number): IAutoMovieSolidMeshPlan.ITriangle => ({
      vertices: [id, (id + 1) % 4, 4],
      lifts: [0, 0, 0],
    }),
  );
  valid(
    failures,
    "near-vertex insertion",
    nearVertex,
    boundary,
    insertAutoMovieSolidMeshPoints(nearVertex, boundary, fan, all),
  );
  if (JSON.stringify({ points: [...points], boundary, triangles }) !== before)
    failures.push("near-diagonal insertion mutated input data");
}

/**
 * A valid triangulation of a square disk with every point: `2V - 4 - 2`
 * triangles by Euler's relation for four boundary vertices, each exactly
 * positive, none holding another point in its closed chart triangle, and every
 * source constraint a side.
 */
function valid(
  failures: string[],
  label: string,
  points: ReadonlyMap<number, readonly [number, number]>,
  constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  made: IAutoMovieSolidMeshPlan.ITriangle[] | string,
): void {
  if (typeof made === "string") {
    failures.push(`${label}: ${made}`);
    return;
  }
  if (made.length !== 2 * points.size - 6)
    failures.push(
      `${label}: ${made.length} triangles for ${points.size} points`,
    );
  for (const id of points.keys())
    if (
      !made.some((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        triangle.vertices.includes(id),
      )
    )
      failures.push(`${label}: original point ${id} lost`);
  for (const triangle of made) {
    const corners: (readonly [number, number])[] = triangle.vertices.map(
      (id: number): readonly [number, number] => points.get(id)!,
    );
    if (orient(corners[0]!, corners[1]!, corners[2]!) <= 0)
      failures.push(
        `${label}: triangle ${triangle.vertices.join("/")} is not exactly positive`,
      );
    for (const [id, point] of points)
      if (
        !triangle.vertices.includes(id) &&
        corners.every(
          (corner: readonly [number, number], k: number): boolean =>
            orient(corner, corners[(k + 1) % 3]!, point) >= 0,
        )
      )
        failures.push(
          `${label}: point ${id} lies in triangle ${triangle.vertices.join("/")}`,
        );
  }
  for (const edge of constraints)
    if (
      !made.some((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        triangle.vertices.some(
          (id: number, k: number): boolean =>
            id === edge.a && triangle.vertices[(k + 1) % 3] === edge.b,
        ),
      )
    )
      failures.push(`${label}: source constraint ${edge.a}->${edge.b} lost`);
}

/**
 * The refusal carries the inserted point's authored ID and exact chart, and
 * both located triangles meet it on the constraint 0-2.
 */
function insertionDiagnostic(
  failures: string[],
  refusal: string,
  insertedId: number,
  insertedChart: readonly [number, number],
): void {
  const marker: string = "; diagnostic=";
  const at: number = refusal.indexOf(marker);
  if (at < 0) {
    failures.push(
      "source-constraint point: missing inserted point and located triangles",
    );
    return;
  }
  try {
    const observation: {
      inserted: { id: number; chart: [number, number] };
      hits: {
        vertices: [number, number, number];
        signs: [number, number, number];
      }[];
    } = JSON.parse(refusal.slice(at + marker.length));
    if (
      observation.inserted.id !== insertedId ||
      observation.inserted.chart[0] !== insertedChart[0] ||
      observation.inserted.chart[1] !== insertedChart[1]
    )
      failures.push(
        "source-constraint point: wrong inserted original ID or chart",
      );
    if (
      observation.hits.length !== 2 ||
      !observation.hits.every(
        (hit: {
          vertices: [number, number, number];
          signs: [number, number, number];
        }): boolean => {
          const side: number = hit.signs.indexOf(0);
          const ends: number[] = [
            hit.vertices[side]!,
            hit.vertices[(side + 1) % 3]!,
          ].sort((x: number, y: number): number => x - y);
          return side >= 0 && ends[0] === 0 && ends[1] === 2;
        },
      )
    )
      failures.push(
        "source-constraint point: located triangles do not meet it on the constraint",
      );
  } catch (error: unknown) {
    failures.push(
      "source-constraint point: unreadable diagnostic: " + String(error),
    );
  }
}

/**
 * A curve that meets a straight constraint at a grazing angle leaves its last
 * vertex a few units of the last place off the line: the face beside that short
 * edge has no represented corridor, but the same face lies beside every other
 * edge of its walk, which must serve. The coordinates are f1's: the concha's
 * cut meeting a grid line of the ear's band, 1e-14 off it at a phase of 16.37.
 */
function grazing(failures: string[]): void {
  const line: number = 16.368318562268914;
  const points: Map<number, readonly [number, number]> = new Map([
    [0, [16.368318562268904, 4.449463121837102]],
    [1, [line, 4.4505895925855405]],
    [2, [line, 4.385139745635753]],
    [3, [line, 4.516039439535327]],
    [10, [16, 4]],
    [11, [17, 4]],
    [12, [17, 5]],
    [13, [16, 5]],
    [14, [line, 4]],
    [15, [line, 5]],
    [16, [16, 4.4]],
  ]);
  // The grazing edge comes first, so its walk is read from it.
  const segments: IAutoMovieSolidMeshConstraints.ISegment[] = [
    [0, 1],
    [16, 0],
    [14, 2],
    [2, 1],
    [1, 3],
    [3, 15],
    [10, 14],
    [14, 11],
    [11, 12],
    [12, 15],
    [15, 13],
    [13, 16],
    [16, 10],
  ].map(
    ([a, b]): IAutoMovieSolidMeshConstraints.ISegment => ({
      a: a!,
      b: b!,
      turn: 0,
    }),
  );
  const made: IAutoMovieSolidMeshPlan.IPlan | string =
    AutoMovieSolidMeshPlan.triangulate(
      points,
      segments,
      (u: number, v: number): boolean => u > 16 && u < 17 && v > 4 && v < 5,
    );
  if (typeof made === "string") {
    failures.push(`grazing edge: ${made}`);
    return;
  }
  let area: number = 0;
  for (const triangle of made.triangles) {
    const [a, b, c] = triangle.vertices.map(
      (id: number): readonly [number, number] => points.get(id)!,
    );
    const value: number =
      ((b![0] - a![0]) * (c![1] - a![1]) - (b![1] - a![1]) * (c![0] - a![0])) /
      2;
    if (!(value > 0)) failures.push("grazing edge made a nonpositive triangle");
    area += value;
  }
  if (!nclose(area, 1, 1e-12))
    failures.push(`grazing edge covered ${area} of the unit square`);
}

/** Removing a common lift must not hide a larger-than-half-period output span. */
function outputCover(failures: string[]): void {
  const exact: Map<number, readonly [number, number]> = new Map([
    [0, [-1, 0.75]],
    [1, [0, 0]],
    [2, [1, 0.5]],
    [3, [0, 0.25]],
  ]);
  const beyond: Map<number, readonly [number, number]> = new Map([
    [0, [-1, 0.75]],
    [1, [0, 0]],
    [2, [1, 0.5000000000000001]],
    [3, [0, 0.25]],
  ]);
  const made: IAutoMovieSolidMeshPlan.ITriangle[] | string =
    triangulateAutoMovieSolidBoundary(
      exact,
      { vertices: [0, 1, 2, 3], lifts: [0, 1, 1, 1], winding: 0 },
      1,
    );
  const refused: IAutoMovieSolidMeshPlan.ITriangle[] | string =
    triangulateAutoMovieSolidBoundary(
      beyond,
      { vertices: [0, 1, 2, 3], lifts: [0, 1, 1, 1], winding: 0 },
      1,
    );
  if (typeof made === "string" || made.length !== 2)
    failures.push("exact half-period output cover was refused");
  if (
    typeof refused !== "string" ||
    !refused.includes("no admitted native-chart ear")
  )
    failures.push(
      "common-lift rounding hid an output cover beyond half a period",
    );
}

/**
 * Eight independently authored points include a collinear midpoint on each
 * side.
 */
function rectangle([x0, y0, x1, y1]: Box): (readonly [number, number])[] {
  return [
    [x0, y0],
    [(x0 + x1) / 2, y0],
    [x1, y0],
    [x1, (y0 + y1) / 2],
    [x1, y1],
    [(x0 + x1) / 2, y1],
    [x0, y1],
    [x0, (y0 + y1) / 2],
  ];
}

/** Author shared identities, then inspect all results of one elementary source. */
function inspect(failures: string[], sample: Case, scale: number): void {
  const label: string = `${sample.name}/${scale}`;
  const points: Map<number, readonly [number, number]> = new Map();
  const identities: Map<string, number> = new Map();
  const constraints: IAutoMovieSolidMeshConstraints.ISegment[] = [];
  for (const polygon of sample.polygons) {
    const ids: number[] = polygon.map(
      (point: readonly [number, number]): number => {
        const key: string = point.join("/");
        const found: number | undefined = identities.get(key);
        if (found !== undefined) return found;
        const id: number = points.size;
        points.set(id, [point[0] * scale, point[1] * scale]);
        identities.set(key, id);
        return id;
      },
    );
    for (let k: number = 0; k < ids.length; k++) {
      const a: number = ids[k]!;
      const b: number = ids[(k + 1) % ids.length]!;
      constraints.push({
        a,
        b,
        turn:
          sample.period === undefined
            ? 0
            : Math.round(
                (points.get(a)![1] - points.get(b)![1]) /
                  (sample.period * scale),
              ),
      });
    }
  }
  for (const point of sample.interior ?? [])
    points.set(points.size, [point[0] * scale, point[1] * scale]);
  const before: string = JSON.stringify({ points: [...points], constraints });
  const keeps: (u: number, v: number) => boolean = (
    u: number,
    v: number,
  ): boolean => sample.keeps(u / scale, v / scale);
  const period: number | undefined =
    sample.period === undefined ? undefined : sample.period * scale;
  const made: IAutoMovieSolidMeshPlan.IPlan | string =
    AutoMovieSolidMeshPlan.triangulate(points, constraints, keeps, period);
  if (typeof made === "string") {
    failures.push(`${label}: ${made}`);
    return;
  }
  if (sample.count !== undefined && made.triangles.length !== sample.count)
    failures.push(
      `${label}: ${made.triangles.length} triangles, expected ${sample.count}`,
    );
  let total: number = 0;
  const edges: Map<string, number> = new Map();
  for (const triangle of made.triangles) {
    const chart: (readonly [number, number])[] = triangle.vertices.map(
      (id: number, k: number): readonly [number, number] => [
        points.get(id)![0],
        points.get(id)![1] + triangle.lifts[k]! * (period ?? 0),
      ],
    );
    const a: readonly [number, number] = chart[0]!;
    const b: readonly [number, number] = chart[1]!;
    const c: readonly [number, number] = chart[2]!;
    const area: number =
      ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
    if (!(area > 0))
      failures.push(`${label}: nonpositive chart triangle ${area}`);
    total += area;
    for (const weights of [
      [1 / 3, 1 / 3, 1 / 3],
      [0.6, 0.2, 0.2],
      [0.2, 0.6, 0.2],
      [0.2, 0.2, 0.6],
    ]) {
      const u: number =
        (a[0] * weights[0]! + b[0] * weights[1]! + c[0] * weights[2]!) / scale;
      const v: number =
        (a[1] * weights[0]! + b[1] * weights[1]! + c[1] * weights[2]!) / scale;
      if (!sample.keeps(u, v))
        failures.push(
          `${label}: triangle interior left its independently authored region at ${u}/${v}`,
        );
    }
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const key: string = `${triangle.vertices[k]}/${triangle.vertices[next]}/${triangle.lifts[next]! - triangle.lifts[k]!}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  try {
    TestValidator.predicate(
      `${label}: area`,
      nclose(
        total,
        sample.area * scale * scale,
        256 *
          Number.EPSILON *
          Math.max(sample.area * scale * scale, Number.MIN_VALUE) *
          Math.max(1, made.triangles.length),
      ),
    );
  } catch {
    failures.push(
      `${label}: area ${total}, expected ${sample.area * scale * scale}`,
    );
  }
  for (const entry of edges) {
    const [key, count]: [string, number] = entry;
    const [a, b, turn]: number[] = key.split("/").map(Number);
    const reverse: number = edges.get(`${b}/${a}/${-turn!}`) ?? 0;
    if (count !== 1 || reverse > 1)
      failures.push(`${label}: multiply used edge ${key}`);
    if (reverse === 0 && !boundary(points, constraints, a!, b!, turn!, period))
      failures.push(`${label}: open interior edge ${key}`);
  }
  if (JSON.stringify({ points: [...points], constraints }) !== before)
    failures.push(`${label}: input mutation`);
  if (sample.name === "collinear square" && made.triangles.length !== 0) {
    const expected: string = JSON.stringify(made);
    made.triangles[0]!.vertices[0] = 999;
    made.triangles[0]!.lifts[0] = 999;
    const repeated: IAutoMovieSolidMeshPlan.IPlan | string =
      AutoMovieSolidMeshPlan.triangulate(points, constraints, keeps, period);
    if (JSON.stringify(repeated) !== expected)
      failures.push(`${label}: retained mutable triangle output`);
  }
}

/**
 * Elementary axis-aligned source interval containment, independent of planner
 * predicates.
 */
function boundary(
  points: ReadonlyMap<number, readonly [number, number]>,
  constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  first: number,
  last: number,
  turn: number,
  period: number | undefined,
): boolean {
  const a: readonly [number, number] = points.get(first)!;
  const stored: readonly [number, number] = points.get(last)!;
  const b: readonly [number, number] = [
    stored[0],
    stored[1] + turn * (period ?? 0),
  ];
  for (const edge of constraints) {
    const c: readonly [number, number] = points.get(edge.a)!;
    const d: readonly [number, number] = points.get(edge.b)!;
    const image: number =
      period === undefined
        ? 0
        : Math.round((a[1] / 2 + b[1] / 2 - c[1]) / period);
    const y0: number = c[1] + image * (period ?? 0);
    const y1: number = d[1] + (image + edge.turn) * (period ?? 0);
    const allowance: number =
      64 *
      Number.EPSILON *
      Math.max(Math.abs(y0), Math.abs(y1), Number.MIN_VALUE);
    if (
      c[0] === d[0] &&
      a[0] === c[0] &&
      b[0] === c[0] &&
      Math.min(a[1], b[1]) >= Math.min(y0, y1) - allowance &&
      Math.max(a[1], b[1]) <= Math.max(y0, y1) + allowance
    )
      return true;
    if (
      y0 === y1 &&
      Math.abs(a[1] - y0) <= allowance &&
      Math.abs(b[1] - y0) <= allowance &&
      Math.min(a[0], b[0]) >= Math.min(c[0], d[0]) &&
      Math.max(a[0], b[0]) <= Math.max(c[0], d[0])
    )
      return true;
  }
  return false;
}

/**
 * No partial triangle population is accepted when the represented source
 * premise fails.
 */
function refuse(
  failures: string[],
  label: string,
  made: IAutoMovieSolidMeshPlan.IPlan | string,
  expected: string,
): void {
  if (typeof made !== "string" || !made.includes(expected))
    failures.push(
      `${label}: expected ${expected}, received ${JSON.stringify(made)}`,
    );
}
