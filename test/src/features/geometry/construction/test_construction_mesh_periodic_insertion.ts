import type {
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";
import {
  AutoMovieSolidMeshPlan,
  insertAutoMovieSolidMeshPoints,
  orientAutoMovieSolidChart as orient,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Source-chart coordinate: station mm and phase radians in the recorded case, plain chart units in the made ones. */
type Point = readonly [number, number];

/** A local periodic partition, a disk whose triangles cross the phase seam, and the point that must enter it. */
interface Case {
  /** Scenario address. */ name: string;

  /** Positive phase period. */ period: number;

  /** Original IDs and exact stored chart numbers; the last entry is the inserted point. */ points: ReadonlyMap<number, Point>;

  /** Existing triangle population before insertion, each in its own cover. */ triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[];

  /** Directed region boundary with the relative turn of each edge. */ boundary: readonly IAutoMovieSolidMeshConstraints.ISegment[];

  /** The vertex whose stored occurrence anchors the one cover every exact sign is read in. */ anchor: number;

  /** Whether the region planner, from the boundary alone, is held to the same contract. */ plan: boolean;
}

/**
 * Interior insertion decides a point against a seam-crossing triangle once, in the point's own cover.
 *
 * Scenarios:
 * 1. The recorded star-band partition: grid node 963 at phase 0 on the
 *    chord from vertex 31 (phase 31 pi / 16) to vertex 874 (phase pi / 16),
 *    whose neighbour across that chord is completed with a made grid corner.
 *    With 31 one period down the node is strictly inside by 2^-52 rad; with
 *    31 at lift zero and the others one period up the same three points are
 *    exactly collinear. Insertion and the region planner triangulate it.
 * 2. A made dyadic square of period 8 across the seam: a point exactly on its
 *    free diagonal splits both triangles into four, and a point strictly
 *    inside one seam-crossing triangle splits it into three.
 * 3. The same point exactly on that diagonal held as a source constraint is
 *    refused by name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public insertion and region planner on in-memory periodic charts and inspects the returned triangles' IDs and lifts. It catches a refusal of a valid exact split, a dropped point, a triangle whose lifts disagree with its neighbours', a nonpositive or overlapping triangle, a half-period span and a subdivided constraint; it allows any valid triangulation of the prescribed points.
 * @evidence contracts/development/testing.md#independent-expectations A triangulated disk with V points, b on its boundary, has 2V - b - 2 triangles by Euler's relation. The corner lifts must give every vertex one occurrence in the cover anchored at one stored vertex; there every triangle must be exactly positive by the orientation sign and hold no other point in its closed triangle, each directed boundary edge must be used once with its turn, and each triangle must span less than half a period in its own cover. The recorded premise is binary64 arithmetic stated in the test: 2 pi - fl(31 pi / 16) exceeds pi / 16 by 2^-52 while fl(pi / 16 + 2 pi) exceeds the exact sum by the same amount. The made square is dyadic, so its diagonal holds the point exactly in every cover.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a point one ulp inside a seam-crossing chord whose other cover reads it collinear, a point exactly on a free seam-crossing diagonal, a point strictly inside a seam-crossing triangle and a point exactly on a seam-crossing source constraint. test_construction_mesh_triangle_witness owns the planar thin-triangle cases and test_construction_mesh_plan the rails, holes and refusal diagnostic.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory CPU unit test_construction_mesh_periodic_insertion, discoverable through --include construction_mesh_periodic_insertion, with no source callback, process, renderer, global replacement or fixture file.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios, the chart units, the recorded rounding premise and the Euler, one-cover sign, lift-consistency and span oracle.
 */
export function test_construction_mesh_periodic_insertion(): void {
  const failures: string[] = [];
  premise(failures);
  for (const input of cases()) {
    const before: string = JSON.stringify({ points: [...input.points], triangles: input.triangles, boundary: input.boundary });
    const keeps: (s: number, t: number) => boolean = membership(input, failures);
    inspect(input, "insertion", insertAutoMovieSolidMeshPoints(
      input.points, input.boundary, input.triangles, keeps, input.period, true,
    ), failures);
    if (input.plan) {
      const plan: IAutoMovieSolidMeshPlan.IPlan | string = AutoMovieSolidMeshPlan.triangulate(
        input.points, input.boundary, keeps, input.period, true,
      );
      inspect(input, "region", typeof plan === "string" ? plan : plan.triangles, failures);
    }
    if (JSON.stringify({ points: [...input.points], triangles: input.triangles, boundary: input.boundary }) !== before)
      failures.push(input.name + ": original points, triangles or source constraints mutated");
  }
  constrained(failures);
  TestValidator.predicate(
    "Periodic insertion findings: " + failures.join(" | "),
    () => failures.length === 0,
  );
}

/** The recorded numbers verbatim: stations in mm, phases in radians of the band's 2 pi period. */
const RECORDED: { period: number; low: number; high: number; station: number } = {
  period: 6.283185307179586,
  low: 6.086835766330224,
  high: 0.19634954084936207,
  station: 9.97442126247365,
};

/** The recorded rounding: the node is strictly left of the chord in its own cover and exactly on it one period up. */
function premise(failures: string[]): void {
  const { period, low, high, station }: typeof RECORDED = RECORDED;
  const own: number = orient([0, low - period], [station, high], [station / 2, 0]);
  const shifted: number = orient([0, low], [station, high + period], [station / 2, period]);
  if (low - period !== -high - 2 ** -52 || high + period - period === high || own !== 1 || shifted !== 0)
    failures.push(`recorded premise unmet: own cover ${own}, shifted cover ${shifted}`);
}

/** The recorded partition, then the made dyadic square with a point on its diagonal and one strictly inside. */
function cases(): Case[] {
  const { period, low, high, station }: typeof RECORDED = RECORDED;
  const square: [number, Point][] = [[0, [0, 7]], [1, [4, 7]], [2, [4, 1]], [3, [0, 1]]];
  const halves: IAutoMovieSolidMeshPlan.ITriangle[] = [
    { vertices: [0, 1, 2], lifts: [0, 0, 1] },
    { vertices: [0, 2, 3], lifts: [0, 1, 1] },
  ];
  const ring: IAutoMovieSolidMeshConstraints.ISegment[] = [
    { a: 0, b: 1, turn: 0 }, { a: 1, b: 2, turn: 1 }, { a: 2, b: 3, turn: 0 }, { a: 3, b: 0, turn: -1 },
  ];
  return [
    {
      name: "recorded star band", period, anchor: 874, plan: true,
      points: new Map([
        [874, [station, high]], [873, [station / 2, high]], [31, [0, low]], [32, [station, low]], [963, [station / 2, 0]],
      ]),
      triangles: [
        { vertices: [874, 873, 31], lifts: [0, 0, -1] },
        { vertices: [874, 31, 32], lifts: [0, -1, -1] },
      ],
      boundary: [
        { a: 31, b: 32, turn: 0 }, { a: 32, b: 874, turn: 1 }, { a: 874, b: 873, turn: 0 }, { a: 873, b: 31, turn: -1 },
      ],
    },
    { name: "made point on a seam-crossing diagonal", period: 8, anchor: 2, plan: true, points: new Map([...square, [4, [2, 0]]]), triangles: halves, boundary: ring },
    { name: "made point inside a seam-crossing triangle", period: 8, anchor: 2, plan: true, points: new Map([...square, [4, [3, 0]]]), triangles: halves, boundary: ring },
  ];
}

/**
 * Every vertex's occurrence in the one cover whose anchor keeps its stored phase, read from the triangles' relative corner lifts; a vertex
 * that two triangles place in different sheets, or that no triangle reaches, is a finding and the cover is absent.
 */
function cover(
  input: Case, triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[], label: string, failures: string[],
): Map<number, Point> | null {
  const lifts: Map<number, number> = new Map([[input.anchor, 0]]);
  for (let changed: boolean = true; changed; ) {
    changed = false;
    for (const triangle of triangles) {
      const known: number = triangle.vertices.findIndex((id: number): boolean => lifts.has(id));
      if (known < 0) continue;
      for (let k: number = 0; k < 3; k++) {
        const lift: number = lifts.get(triangle.vertices[known]!)! + triangle.lifts[k]! - triangle.lifts[known]!;
        const held: number | undefined = lifts.get(triangle.vertices[k]!);
        if (held === undefined) {
          lifts.set(triangle.vertices[k]!, lift);
          changed = true;
        } else if (held !== lift) {
          failures.push(`${label}: triangle ${triangle.vertices.join("/")} places vertex ${triangle.vertices[k]} in sheet ${lift}, another in ${held}`);
          return null;
        }
      }
    }
  }
  const result: Map<number, Point> = new Map();
  for (const [id, lift] of lifts) result.set(id, [input.points.get(id)![0], input.points.get(id)![1] + lift * input.period]);
  return result;
}

/** Membership is the closed union of the case's own input triangles in the anchored cover, read by exact signs at the probe's three nearest images. */
function membership(input: Case, failures: string[]): (s: number, t: number) => boolean {
  const chart: Map<number, Point> = cover(input, input.triangles, input.name + " input", failures) ?? new Map();
  return (s: number, t: number): boolean =>
    [-1, 0, 1].some((turn: number): boolean =>
      input.triangles.some((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        triangle.vertices.every((id: number, k: number): boolean =>
          chart.has(id) && orient(chart.get(id)!, chart.get(triangle.vertices[(k + 1) % 3]!)!, [s, t + turn * input.period]) >= 0),
      ),
    );
}

/** A valid triangulation of the periodic disk: Euler's count, every ID, one sheet per vertex, exact positive and empty triangles, each boundary edge once and no half-period span. */
function inspect(input: Case, stage: string, made: readonly IAutoMovieSolidMeshPlan.ITriangle[] | string, failures: string[]): void {
  const label: string = `${input.name} ${stage}`;
  if (typeof made === "string") {
    failures.push(`${label}: refused: ${made.split("; diagnostic=")[0]}`);
    return;
  }
  const expected: number = 2 * input.points.size - input.boundary.length - 2;
  if (made.length !== expected) failures.push(`${label}: ${made.length} triangles, Euler requires ${expected}`);
  for (const id of input.points.keys())
    if (!made.some((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean => triangle.vertices.includes(id)))
      failures.push(`${label}: original point ${id} lost`);
  const chart: Map<number, Point> | null = cover(input, made, label, failures);
  if (chart === null) return;
  for (const triangle of made) {
    const name: string = triangle.vertices.join("/");
    if (triangle.lifts[0] !== 0) failures.push(`${label}: triangle ${name} does not begin its cover at lift zero`);
    if (!triangle.vertices.every((id: number): boolean => chart.has(id))) {
      failures.push(`${label}: triangle ${name} is not joined to the anchored cover`);
      continue;
    }
    const corners: Point[] = triangle.vertices.map((id: number): Point => chart.get(id)!);
    if (orient(corners[0]!, corners[1]!, corners[2]!) <= 0)
      failures.push(`${label}: triangle ${name} is not exactly positive in the anchored cover`);
    for (const [id, point] of chart)
      if (!triangle.vertices.includes(id) && corners.every((corner: Point, k: number): boolean =>
        orient(corner, corners[(k + 1) % 3]!, point) >= 0))
        failures.push(`${label}: point ${id} lies in triangle ${name}`);
    const phases: number[] = triangle.vertices.map((id: number, k: number): number =>
      input.points.get(id)![1] + triangle.lifts[k]! * input.period);
    if (!(Math.max(...phases) - Math.min(...phases) < input.period / 2))
      failures.push(`${label}: triangle ${name} spans half a period in its own cover`);
  }
  for (const edge of input.boundary) {
    let forward: number = 0;
    let backward: number = 0;
    for (const triangle of made)
      for (let k: number = 0; k < 3; k++) {
        const next: number = (k + 1) % 3;
        const turn: number = triangle.lifts[next]! - triangle.lifts[k]!;
        if (triangle.vertices[k] === edge.a && triangle.vertices[next] === edge.b && turn === edge.turn) forward++;
        if (triangle.vertices[k] === edge.b && triangle.vertices[next] === edge.a) backward++;
      }
    if (forward !== 1 || backward !== 0)
      failures.push(`${label}: source boundary ${edge.a}->${edge.b} used ${forward} times forward and ${backward} backward`);
  }
}

/** A point exactly on a seam-crossing source constraint has no authoritative subdivision; the same partition without that constraint splits. */
function constrained(failures: string[]): void {
  const input: Case = cases()[1]!;
  const refused: IAutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    input.points, [...input.boundary, { a: 0, b: 2, turn: 1 }], input.triangles, (): boolean => true, input.period, true,
  );
  if (typeof refused !== "string" || !refused.includes("authoritative source-edge subdivision"))
    failures.push(`point on a seam-crossing source constraint was not refused by name: ${JSON.stringify(refused)}`);
  const free: IAutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    input.points, input.boundary, input.triangles, (): boolean => true, input.period, true,
  );
  if (typeof free === "string" || free.length !== 4 ||
    !free.every((triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean => triangle.vertices.includes(4)))
    failures.push(`point on a free seam-crossing diagonal did not split both triangles: ${JSON.stringify(free)}`);
}
