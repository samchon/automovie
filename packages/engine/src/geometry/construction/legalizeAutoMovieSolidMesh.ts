import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { incircleAutoMovieSolidChart } from "./incircleAutoMovieSolidChart";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** One represented native chart coordinate. */
type Point = readonly [number, number];

/** One directed side of a triangle: the edge from `corner` to the next corner. */
interface Side {
  /** Triangle index. */ triangle: number;
  /** Corner the side leaves. */ corner: number;
}

/**
 * Flip a triangulation's free diagonals until each is locally Delaunay in the
 * face's uniform metric: the constrained Delaunay triangulation (Lawson 1977).
 *
 * A boundary-only ear triangulation fans a dense rail into triangles of its
 * own consecutive vertices before any interior point exists, and an interior
 * insertion never revisits them. Three points of one curve span its
 * osculating plane, which for a rail on a curved skin stands across the skin,
 * so those triangles stand edge-on and can face inward. Legalization flips a
 * diagonal whose quadrilateral's fourth vertex lies strictly inside the
 * circumcircle of a triangle. An ear's tip is convex, so the circle of three
 * nearly collinear rail vertices bulges into the face and holds the opposite
 * vertex; such a diagonal always flips, joining the tip to the interior.
 *
 * The in-circle test reads the chart with phase multiplied by `scale`:
 * Delaunay under a uniform anisotropic metric (George and Borouchaki 1998,
 * Delaunay Triangulation and Meshing, parametric surfaces), here the face's
 * mean first fundamental form without its shear term. The scale carries the
 * length unit (millimetres of skin per radian), so a body in another unit
 * scales station and scaled phase alike and reads the same decisions up to
 * the rounding of nearly cocircular quadruples, the premise the planner's
 * other rounded admissions already state. The in-circle sign is exact on the
 * represented scaled points of one canonical cover, and that one constant
 * linear map keeps Lawson's termination: a flip lowers the lifted paraboloid
 * surface, so a removed edge never returns and at most `n (n - 1) / 2` flips
 * occur for `n` vertices (Edelsbrunner 2001, Geometry and Topology for Mesh
 * Generation); a longer run is a named failure.
 *
 * A face whose phase scale changes across it is legalized in its local
 * metric instead (`local`): each quadrilateral is read with the scale at its
 * own centroid, the anisotropic Delaunay criterion of the same authors with
 * the metric frozen per test. A face's mean scale left the trunk's
 * triangles beside the armscye's loop, where the skin spans twice the mean
 * per radian, 4 to 7 degrees thin on the skin. A flip and its reverse read one
 * quadrilateral and so one scale, so no pair of flips undoes itself; the
 * lifting argument no longer bounds longer cycles, and the same flip count
 * stays the named failure.
 *
 * Every source constraint (trim, domain and retained-cell boundaries) is
 * fixed, so the rails, their vertices and the seam they share with another
 * face are unchanged. A flip is admitted only when both new triangles keep the
 * planner's own rules: positive chart orientation, a represented strict
 * interior, a sub-half-period phase span (strict when indexed), a new vertex
 * pair absent from the face's edges, its constraints and the occupied global
 * pairs. Each quadrilateral is read in one canonical cover, its least vertex
 * ID's occurrence at lift zero, so a flip and its reverse read the same four
 * represented points. Free diagonals are visited in triangle and corner order,
 * and every flip queues its four outer sides in that order.
 *
 * @param vertices Indexed native chart positions; no coordinate changes.
 * @param constraints Subdivided source constraints, never flipped.
 * @param triangles Positive triangle occurrences covering the region once.
 * @param period Positive phase period, absent for a planar chart.
 * @param indexed Whether the consumer drops lifts into a global index buffer, which forbids a half-period span.
 * @param occupied Prior global endpoint pairs `minID/maxID` a new diagonal cannot reuse.
 * @param scale Phase scale of the uniform metric, positive and finite, in length units per radian.
 * @param local The face's phase scale where a chart point lies, read in place of `scale` at the centroid of each quadrilateral, so the face is Delaunay in its own local metric where its phase scale changes across it; absent, `scale` holds everywhere. A flip and its reverse read the same four points and so the same scale.
 * @returns New positive triangle occurrences over the same region and vertices, or the broken premise.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Lawson's flip algorithm reaches the constrained Delaunay triangulation by exact lifted in-circle and orientation signs on one scaled chart that carries the length unit; the planner's own representability rules admit each flip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One index-only pass follows interior insertion; the planner keeps visibility and coverage, the in-circle predicate its arithmetic and the grid its metric.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves no point, removes no vertex and flips no source constraint; an inconsistent incidence or a flip count past Lawson's bound is a named failure, never a partial result.
 * @evidence contracts/development/common.md#meaningful-documentation States why rail ears survive insertion, why their diagonals flip, the metric and its exactness, termination, fixed constraints, admission and visiting order.
 * @evidence contracts/development/implementation.md#efficient-algorithms One adjacency map and a work queue; each in-circle test is constant work, and at most `n (n - 1) / 2` flips each queue four sides.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planner's indexed positions and split constraints; no surface jet is evaluated and no point constructed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adjacency, pair counts and the queue are call-local O(T) storage; returned triangle triples are fresh and caller-owned.
 */
export function legalizeAutoMovieSolidMesh(
  vertices: ReadonlyMap<number, Point>,
  constraints: readonly AutoMovieSolidMeshConstraints.ISegment[],
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  period: number | undefined,
  indexed: boolean,
  occupied: ReadonlySet<string> | undefined,
  scale: number,
  local?: (u: number, v: number) => number,
): AutoMovieSolidMeshPlan.ITriangle[] | string {
  if (!(Number.isFinite(scale) && scale > 0))
    return "legalization metric scale must be positive and finite";
  if (period !== undefined && !(Number.isFinite(period) && period > 0))
    return "legalization needs a finite positive period";
  const result: AutoMovieSolidMeshPlan.ITriangle[] = triangles.map(
    (
      triangle: AutoMovieSolidMeshPlan.ITriangle,
    ): AutoMovieSolidMeshPlan.ITriangle => ({
      vertices: [...triangle.vertices],
      lifts: [...triangle.lifts],
    }),
  );
  const fixed: Set<string> = new Set(
    constraints.map((edge: AutoMovieSolidMeshConstraints.ISegment): string =>
      key(edge.a, edge.b, edge.turn),
    ),
  );
  const pairs: Map<string, number> = new Map();
  const count = (a: number, b: number, change: number): void => {
    const name: string = pair(a, b);
    pairs.set(name, (pairs.get(name) ?? 0) + change);
  };
  // Every distinct edge identity, constraint or triangle side, counts once against its vertex pair.
  const counted: Set<string> = new Set();
  for (const segment of constraints) {
    const name: string = key(segment.a, segment.b, segment.turn);
    if (counted.has(name)) continue;
    counted.add(name);
    count(segment.a, segment.b, 1);
  }
  const sides: Map<string, Side[]> = new Map();
  const attach = (triangle: number): string | undefined => {
    for (let corner: number = 0; corner < 3; corner++) {
      const name: string = edge(result[triangle]!, corner);
      const owners: Side[] = sides.get(name) ?? [];
      if (owners.length === 0 && !fixed.has(name)) {
        const t: AutoMovieSolidMeshPlan.ITriangle = result[triangle]!;
        count(t.vertices[corner]!, t.vertices[(corner + 1) % 3]!, 1);
      }
      owners.push({ triangle, corner });
      if (owners.length > 2)
        return "legalization needs manifold diagonal incidence";
      sides.set(name, owners);
    }
    return undefined;
  };
  const detach = (triangle: number): void => {
    for (let corner: number = 0; corner < 3; corner++) {
      const name: string = edge(result[triangle]!, corner);
      const owners: Side[] = (sides.get(name) ?? []).filter(
        (side: Side): boolean => side.triangle !== triangle,
      );
      if (owners.length === 0) {
        sides.delete(name);
        if (!fixed.has(name)) {
          const t: AutoMovieSolidMeshPlan.ITriangle = result[triangle]!;
          count(t.vertices[corner]!, t.vertices[(corner + 1) % 3]!, -1);
        }
      } else sides.set(name, owners);
    }
  };
  for (let triangle: number = 0; triangle < result.length; triangle++) {
    const failure: string | undefined = attach(triangle);
    if (failure !== undefined) return failure;
  }

  const queue: string[] = [];
  const queued: Set<string> = new Set();
  const enqueue = (name: string): void => {
    if (fixed.has(name) || queued.has(name)) return;
    queued.add(name);
    queue.push(name);
  };
  for (let triangle: number = 0; triangle < result.length; triangle++)
    for (let corner: number = 0; corner < 3; corner++)
      enqueue(edge(result[triangle]!, corner));
  const distinct: number = new Set(
    result.flatMap(
      (t: AutoMovieSolidMeshPlan.ITriangle): number[] => t.vertices,
    ),
  ).size;
  const limit: number = (distinct * (distinct - 1)) / 2;
  let flips: number = 0;
  for (let cursor: number = 0; cursor < queue.length; cursor++) {
    const name: string = queue[cursor]!;
    queued.delete(name);
    const owners: Side[] | undefined = sides.get(name);
    if (owners === undefined || owners.length !== 2) continue;
    const made:
      | [AutoMovieSolidMeshPlan.ITriangle, AutoMovieSolidMeshPlan.ITriangle]
      | null = flip(
      vertices,
      result,
      owners[0]!,
      owners[1]!,
      period,
      indexed,
      scale,
      local,
    );
    if (made === null) continue;
    const apart: string = pair(made[0].vertices[1], made[0].vertices[2]);
    if (occupied?.has(apart) === true || (pairs.get(apart) ?? 0) !== 0)
      continue;
    if (++flips > limit)
      return `legalization exceeded Lawson's ${limit} flips for ${distinct} vertices; the incidence is inconsistent`;
    const first: number = owners[0]!.triangle;
    const second: number = owners[1]!.triangle;
    detach(first);
    detach(second);
    result[first] = made[0];
    result[second] = made[1];
    for (const triangle of [first, second]) {
      const failure: string | undefined = attach(triangle);
      if (failure !== undefined) return failure;
    }
    for (const triangle of [first, second])
      for (let corner: number = 0; corner < 3; corner++) {
        const side: string = edge(result[triangle]!, corner);
        if (side !== edge(made[0], 1)) enqueue(side);
      }
  }
  return result;
}

/**
 * The flipped pair across a shared side, or null when the side is locally
 * Delaunay or a new triangle breaks the planner's representability rules.
 * The first returned triangle is `(P, S, R)` and the second `(S, Q, R)`, so the
 * new diagonal is the first triangle's side from corner 1 to corner 2.
 */
function flip(
  vertices: ReadonlyMap<number, Point>,
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  one: Side,
  two: Side,
  period: number | undefined,
  indexed: boolean,
  uniform: number,
  local: ((u: number, v: number) => number) | undefined,
): [AutoMovieSolidMeshPlan.ITriangle, AutoMovieSolidMeshPlan.ITriangle] | null {
  const t1: AutoMovieSolidMeshPlan.ITriangle = triangles[one.triangle]!;
  const t2: AutoMovieSolidMeshPlan.ITriangle = triangles[two.triangle]!;
  const at = (
    t: AutoMovieSolidMeshPlan.ITriangle,
    corner: number,
  ): [number, number] => [t.vertices[corner % 3]!, t.lifts[corner % 3]!];
  const [p, lp] = at(t1, one.corner);
  const [q, lq] = at(t1, one.corner + 1);
  const [r, lr] = at(t1, one.corner + 2);
  const [q2, lq2] = at(t2, two.corner);
  const [p2, lp2] = at(t2, two.corner + 1);
  const [s, ls2] = at(t2, two.corner + 2);
  // The second triangle must run the shared side backwards in the same cover.
  if (q2 !== q || p2 !== p) return null;
  const offset: number = lp - lp2;
  if (lq2 + offset !== lq) return null;
  const ls: number = ls2 + offset;
  const ids: number[] = [p, q, r, s];
  if (new Set(ids).size !== 4) return null;
  // One canonical cover: the least ID's occurrence at lift zero.
  const lifts: number[] = [lp, lq, lr, ls];
  const base: number = lifts[ids.indexOf(Math.min(...ids))]!;
  const points: Point[] = ids.map((id: number, k: number): Point => {
    const stored: Point = vertices.get(id)!;
    return [stored[0], stored[1] + (lifts[k]! - base) * (period ?? 0)];
  });
  if (!points.every((point: Point): boolean => point.every(Number.isFinite)))
    return null;
  const scale: number =
    local === undefined
      ? uniform
      : local(
          (points[0]![0] + points[1]![0] + points[2]![0] + points[3]![0]) / 4,
          (points[0]![1] + points[1]![1] + points[2]![1] + points[3]![1]) / 4,
        );
  if (!(Number.isFinite(scale) && scale > 0)) return null;
  const scaled: Point[] = points.map(
    (point: Point): Point => [point[0], point[1] * scale],
  );
  if (!scaled.every((point: Point): boolean => point.every(Number.isFinite)))
    return null;
  const [P, Q, R, S] = scaled as [Point, Point, Point, Point];
  if (incircleAutoMovieSolidChart(P, Q, R, S) <= 0) return null;
  const [cp, cq, cr, cs] = points as [Point, Point, Point, Point];
  if (
    !represented([cp, cs, cr], period, indexed) ||
    !represented([cs, cq, cr], period, indexed)
  )
    return null;
  return [
    { vertices: [p, s, r], lifts: [0, ls - lp, lr - lp] },
    { vertices: [s, q, r], lifts: [0, lq - ls, lr - ls] },
  ];
}

/** The planner's rule: positive, a represented strict centroid and a sub-half-period span. */
function represented(
  points: Point[],
  period: number | undefined,
  indexed: boolean,
): boolean {
  const phases: number[] = points.map((point: Point): number => point[1]);
  const span: number = Math.max(...phases) - Math.min(...phases);
  if (
    period !== undefined &&
    (span > period / 2 || (indexed && span === period / 2))
  )
    return false;
  const center: Point = [
    points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3,
    points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3,
  ];
  return (
    center.every(Number.isFinite) &&
    points.every(
      (point: Point, index: number): boolean =>
        orientAutoMovieSolidChart(point, points[(index + 1) % 3]!, center) > 0,
    )
  );
}

/** A triangle side's identity with its relative cover turn. */
function edge(
  triangle: AutoMovieSolidMeshPlan.ITriangle,
  corner: number,
): string {
  const next: number = (corner + 1) % 3;
  return key(
    triangle.vertices[corner]!,
    triangle.vertices[next]!,
    triangle.lifts[next]! - triangle.lifts[corner]!,
  );
}

/** Canonical indexed edge identity retaining the relative period turn, as the insertion owner reads it. */
function key(a: number, b: number, turn: number): string {
  return a === b
    ? `${a}/${b}/${Math.abs(turn)}`
    : a < b
      ? `${a}/${b}/${turn}`
      : `${b}/${a}/${-turn}`;
}

/** Unoriented global endpoint pair, as the face's occupied set names it. */
function pair(a: number, b: number): string {
  return `${Math.min(a, b)}/${Math.max(a, b)}`;
}
