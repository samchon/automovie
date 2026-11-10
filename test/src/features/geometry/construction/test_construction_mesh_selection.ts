import {
  type AutoMovieSolidMeshConstraints,
  AutoMovieSolidMeshPlan,
  triangulateAutoMovieSolidBoundary,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionGridAuthorities } from "../../internal/construction/ConstructionGridAuthorities";
import { ConstructionMeshSelectionGeometry } from "../../internal/construction/ConstructionMeshSelectionGeometry";
import { nclose } from "../../internal/nclose";

/** One original native-chart position, with station length and dimensionless phase. */
type Point = readonly [number, number];

/**
 * Native boundary selection is independent of rounded metric rankings.
 *
 * Scenarios:
 * 1. Convex trapezoids at three station units, exact/one-ULP/plainly unequal
 *    diagonal lengths and four cyclic starts retain a prescribed ID diagonal.
 * 2. A hexagon prefers an original two-edge arc over the next smaller tip ID,
 *    distinguishing occurrence locality from a pure-ID fan.
 * 3. A centered square hole retains its independent normalized chart area,
 *    membership, source edges and exact indexed topology at three units.
 * 4. A periodic concave U retains its six positive triangles, original points,
 *    analytic area and topology across three units, four starts and a phase translation.
 * 5. A proposed diagonal passing beside a distinct original point cannot strand
 *    the observed unrepresentable thin triangle; another indexed partition retains all five points.
 * 6. Two cylinder rims with 20/15 phase intervals preserve all 37 points and 35 triangles, area 6 after station normalization, outward radial-plus-z chords and exact topology across three units and four cyclic starts. A separate phase rotation retains those geometric checks.
 * 7. A parabolic face preserves its independent cell chord bound and foreign shared domain IDs; exact/extra/near/coarse boundary populations remain distinct at three world units and both orientations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real boundary ear owner and complete native planner, then inspects original IDs, positive triangles, point ownership and public topology. It does not infer an internal chosen bridge from a later diagonal.
 * @evidence contracts/development/testing.md#independent-expectations Native chart area divided by station scale is 0.75+0.375*departure for the trapezoid,16-4=12 for the centered square hole,4*3-2*2=8 for the U and2*3=6 for the cylinder strip; raw areas have an additional scale factor. The literal ear diagonal follows the declared occurrence-gap/tip-ID policy and N+2H-2 gives eight hole triangles. The strip maps exactly to (20*scale*cos(phi),20*scale*sin(phi),u); outward chords must face its independent radial-plus-z vector. Unit covariance compares public ID triples alongside independent geometry rather than a stored implementation snapshot.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes near and far unequal lengths, cyclic starts, original-arc versus pure-ID order, a nontrivial hole and three positive length units. Membership probes and edge incidence are discrete checks, not a continuous world-surface certificate; malformed/periodic/atomic cases belong to the existing plan and consumer questions.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU test through construction_mesh_selection, using made charts only, with no person, host, render, process or foreign replacement.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Convex trapezoids at three station units, exact/one-ULP/plainly unequal).
 */
export function test_construction_mesh_selection(): void {
  const failures: string[] = [];
  ears(failures);
  ConstructionMeshSelectionGeometry.occupied(failures);
  holes(failures);
  ConstructionMeshSelectionGeometry.concave(failures);
  ConstructionMeshSelectionGeometry.thin(failures);
  ConstructionMeshSelectionGeometry.strip(failures);
  ConstructionGridAuthorities(failures);
  if (failures.length !== 0)
    throw new Error(`Native selection findings:\n${failures.join("\n")}`);
}

/** Literal admitted cuts pin integer policy without moving the geometric inputs. */
function ears(failures: string[]): void {
  for (const scale of [0.001, 1, 1000]) {
    for (const offset of [0, Number.EPSILON, 0.25]) {
      const points: Point[] = [
        [0, 0],
        [(1 + offset) * scale, 0.25],
        [scale, 0.75],
        [0, 1],
      ];
      const vertices: Map<number, Point> = new Map(
        points.map((point: Point, id: number): [number, Point] => [id, point]),
      );
      const before: string = JSON.stringify([...vertices]);
      for (const first of [0, 1, 2, 3]) {
        const ring: number[] = [0, 1, 2, 3];
        const made: AutoMovieSolidMeshPlan.ITriangle[] | string =
          triangulateAutoMovieSolidBoundary(vertices, {
            vertices: [...ring.slice(first), ...ring.slice(0, first)],
            lifts: [0, 0, 0, 0],
            winding: 0,
          });
        if (typeof made === "string") {
          failures.push(`integer ear order/${scale}/${offset}: ${made}`);
          continue;
        }
        if (ConstructionMeshSelectionGeometry.keys(made) !== "0/1/3;1/2/3")
          failures.push(
            `integer ear order/${scale}/${offset}: ${ConstructionMeshSelectionGeometry.keys(made)}`,
          );
        let area: number = 0;
        for (const triangle of made) {
          const a: Point = points[triangle.vertices[0]]!;
          const b: Point = points[triangle.vertices[1]]!;
          const c: Point = points[triangle.vertices[2]]!;
          const value: number =
            ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
          if (!(value > 0))
            failures.push("ear order lost positive orientation");
          area += value;
        }
        try {
          TestValidator.predicate(
            "authored trapezoid area",
            nclose(area / scale, 0.75 + 0.375 * offset, 1e-12),
          );
        } catch {
          failures.push("integer ear order changed the authored area");
        }
      }
      if (JSON.stringify([...vertices]) !== before)
        failures.push("integer ear order changed an original point");
    }

    // After0, tip2 spans two original edges while tip1 spans three.
    const hexagon: Map<number, Point> = new Map([
      [0, [0, 0]],
      [1, [scale, 0]],
      [2, [2 * scale, 1]],
      [3, [2 * scale, 2]],
      [4, [scale, 3]],
      [5, [0, 2]],
    ]);
    const balanced: AutoMovieSolidMeshPlan.ITriangle[] | string =
      triangulateAutoMovieSolidBoundary(hexagon, {
        vertices: [0, 1, 2, 3, 4, 5],
        lifts: [0, 0, 0, 0, 0, 0],
        winding: 0,
      });
    if (
      typeof balanced === "string" ||
      balanced[1]?.vertices.join("/") !== "1/2/3"
    )
      failures.push(`integer ear locality/${scale}: lost original short arc`);
  }
}

/** Observable hole geometry and scale covariance do not identify an internal bridge. */
function holes(failures: string[]): void {
  let reference: string | undefined;
  for (const scale of [0.001, 1, 1000]) {
    const points: Point[] = [
      [0, 0],
      [4 * scale, 0],
      [4 * scale, 4],
      [0, 4],
      [3 * scale, 1],
      [scale, 1],
      [scale, 3],
      [3 * scale, 3],
    ];
    const vertices: Map<number, Point> = new Map(
      points.map((point: Point, id: number): [number, Point] => [id, point]),
    );
    const constraints: AutoMovieSolidMeshConstraints.ISegment[] = [];
    for (const ring of [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ])
      for (let k: number = 0; k < 4; k++)
        constraints.push({ a: ring[k]!, b: ring[(k + 1) % 4]!, turn: 0 });
    const before: string = JSON.stringify({
      points: [...vertices],
      constraints,
    });
    const contains: (u: number, v: number) => boolean = (
      u: number,
      v: number,
    ): boolean => {
      const x: number = u / scale;
      return (
        x > 0 && x < 4 && v > 0 && v < 4 && !(x > 1 && x < 3 && v > 1 && v < 3)
      );
    };
    const made: AutoMovieSolidMeshPlan.IPlan | string =
      AutoMovieSolidMeshPlan.triangulate(vertices, constraints, contains);
    if (typeof made === "string") {
      failures.push(`hole selection/${scale}: ${made}`);
      continue;
    }
    if (made.triangles.length !== 8)
      failures.push(`hole selection/${scale}: expected eight triangles`);
    const topology: string = ConstructionMeshSelectionGeometry.keys(
      made.triangles,
    );
    if (reference === undefined) reference = topology;
    else if (topology !== reference)
      failures.push(`hole selection/${scale}: unit-dependent ID topology`);

    let area: number = 0;
    const edges: Map<string, number> = new Map();
    for (const triangle of made.triangles) {
      if (triangle.lifts.some((lift: number): boolean => lift !== 0))
        failures.push("planar selection introduced a cover lift");
      const a: Point = points[triangle.vertices[0]]!;
      const b: Point = points[triangle.vertices[1]]!;
      const c: Point = points[triangle.vertices[2]]!;
      const value: number =
        ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      if (!(value > 0))
        failures.push("hole selection lost positive orientation");
      area += value;
      for (const weights of [
        [1 / 3, 1 / 3, 1 / 3],
        [0.6, 0.2, 0.2],
        [0.2, 0.6, 0.2],
        [0.2, 0.2, 0.6],
      ]) {
        const u: number =
          a[0] * weights[0]! + b[0] * weights[1]! + c[0] * weights[2]!;
        const v: number =
          a[1] * weights[0]! + b[1] * weights[1]! + c[1] * weights[2]!;
        if (!contains(u, v))
          failures.push("hole triangle left its analytic region");
      }
      for (let k: number = 0; k < 3; k++) {
        const edge: string = `${triangle.vertices[k]}/${triangle.vertices[(k + 1) % 3]}`;
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    const source: Set<string> = new Set(
      constraints.map(
        (edge: AutoMovieSolidMeshConstraints.ISegment): string =>
          `${edge.a}/${edge.b}`,
      ),
    );
    for (const entry of edges) {
      const [edge, count]: [string, number] = entry;
      const [a, b]: string[] = edge.split("/");
      const reverse: number = edges.get(`${b}/${a}`) ?? 0;
      if (count !== 1 || reverse !== (source.has(edge) ? 0 : 1))
        failures.push(`hole selection/${scale}: invalid directed edge ${edge}`);
    }
    for (const edge of source)
      if (edges.get(edge) !== 1)
        failures.push(`lost original hole edge ${edge}`);
    try {
      TestValidator.predicate(
        "rectangle-minus-hole area",
        nclose(area / scale, 12, 1e-12),
      );
    } catch {
      failures.push(
        `hole selection/${scale}: area ${area / scale}, expected12`,
      );
    }
    if (JSON.stringify({ points: [...vertices], constraints }) !== before)
      failures.push("hole selection changed original points or constraints");
  }
}
