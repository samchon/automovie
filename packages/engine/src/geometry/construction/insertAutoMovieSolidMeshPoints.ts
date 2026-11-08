import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** One represented native chart coordinate. */
type Point = readonly [number, number];

/** A containing triangle and the point's cover occurrence within it. */
interface Hit {
  /** Triangle index before this insertion. */ index: number;
  /** Integer periods added to the stored point. */ lift: number;
  /** Three exact represented-point edge signs. */ signs: [
    number,
    number,
    number,
  ];
}

/** A directed cavity edge, with lifts measured relative to the new point's stored sheet. */
interface Boundary {
  /** Original first endpoint. */ a: number;
  /** Original second endpoint. */ b: number;
  /** First endpoint's sheet relative to the inserted point. */ first: number;
  /** Second endpoint's sheet relative to the inserted point. */ last: number;
}

/**
 * Insert admitted residual grid points without changing an existing boundary.
 *
 * Interior insertion starts from its containing triangle(s). If a new fan
 * would have no represented strict interior, only unconstrained neighbouring
 * triangles extend its visible cavity; source constraints and points stay fixed.
 * Constraint vertices are left with the boundary owner, including unused
 * redundant boundaries in removed regions. Distinct coincident identities and
 * a kept point outside the supplied triangulation fail explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Uses exact edge signs to locate a point and extend a visible cavity across unconstrained shared diagonals until every new triangle has a represented strict interior in its actual output cover.
 * @evidence contracts/common.md#clear-and-simple-design One index-only insertion follows boundary ear triangulation; source grid evaluation and boundary subdivision remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constructs no point, weld or new source-boundary index. An unshared boundary hit, ambiguous cover, coincident identity or nonmanifold containing population returns a named failure before publishing a partial result.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes constraint vertices, strict interior insertion and shared-diagonal insertion, with explicit cover/ownership failure.
 * @evidence contracts/performance.md#efficient-algorithms Each inserted point scans/indexes current triangles and adds each cavity triangle at most once, giving O(M(T+M)) location, adjacency and cavity work plus one keeps query per eligible point.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses original points and constraints, builds one diagonal adjacency table per insertion and visits each selected cavity triangle once; no resampling, snapping or source evaluation occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Working/output triangles and identity sets have O(V+T+M) storage; input arrays/maps and the membership callback are not retained, and every returned triangle triple is caller-owned.
 */
export function insertAutoMovieSolidMeshPoints(
  vertices: ReadonlyMap<number, Point>,
  constraints: readonly AutoMovieSolidMeshConstraints.ISegment[],
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  keeps: (u: number, v: number) => boolean,
  period?: number,
  indexed: boolean = false,
): AutoMovieSolidMeshPlan.ITriangle[] | string {
  if (period !== undefined && !(Number.isFinite(period) && period > 0))
    return "interior insertion needs a finite positive period";
  const constrained: Set<number> = new Set(
    constraints.flatMap(
      (edge: AutoMovieSolidMeshConstraints.ISegment): number[] => [
        edge.a,
        edge.b,
      ],
    ),
  );
  const sourceEdges: Set<string> = new Set(constraints.map((edge: AutoMovieSolidMeshConstraints.ISegment): string => key(edge.a, edge.b, edge.turn)));
  let result: AutoMovieSolidMeshPlan.ITriangle[] = triangles.map(
    (
      triangle: AutoMovieSolidMeshPlan.ITriangle,
    ): AutoMovieSolidMeshPlan.ITriangle => ({
      vertices: [...triangle.vertices],
      lifts: [...triangle.lifts],
    }),
  );
  const present: Set<number> = new Set(
    result.flatMap(
      (triangle: AutoMovieSolidMeshPlan.ITriangle): number[] =>
        triangle.vertices,
    ),
  );
  for (const entry of vertices) {
    const [id, point]: [number, Point] = entry;
    if (present.has(id) || constrained.has(id) || !keeps(point[0], point[1]))
      continue;
    const hits: Hit[] | string = locate(vertices, result, point, period);
    if (typeof hits === "string") return hits;
    if (hits.length === 0 || hits.length > 2)
      return "kept interior point has no unique manifold containing population";
    const onEdges: number[] = hits.map((hit: Hit): number =>
      hit.signs.findIndex((sign: number): boolean => sign === 0),
    );
    if (hits.length === 1 && onEdges[0] !== -1)
      return "interior point hits an unshared boundary without an authoritative subdivision";
    if (
      hits.length === 2 &&
      (onEdges.some((edge: number): boolean => edge === -1) ||
        edgeKey(result[hits[0]!.index]!, onEdges[0]!) !==
          edgeKey(result[hits[1]!.index]!, onEdges[1]!))
    )
      return "interior point does not share one original diagonal";
    if (hits.length === 2 && sourceEdges.has(edgeKey(result[hits[0]!.index]!, onEdges[0]!))) return "interior point needs an authoritative source-edge subdivision";
    const next: AutoMovieSolidMeshPlan.ITriangle[] | string = cavity(vertices, result, hits, sourceEdges, id, point, period, indexed);
    if (typeof next === "string") return next;
    result = next;
    present.add(id);
  }
  return result;
}

/** Locate every incident triangle with exact edge signs and represented cover arithmetic. */
function locate(
  vertices: ReadonlyMap<number, Point>,
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  point: Point,
  period: number | undefined,
): Hit[] | string {
  const hits: Hit[] = [];
  for (let index: number = 0; index < triangles.length; index++) {
    const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[index]!;
    const chart: Point[] = triangle.vertices.map(
      (id: number, k: number): Point => [
        vertices.get(id)![0],
        vertices.get(id)![1] + triangle.lifts[k]! * (period ?? 0),
      ],
    );
    const nearest: number =
      period === undefined ? 0 : Math.round((chart[0]![1] - point[1]) / period);
    const images: number[] =
      period === undefined ? [0] : [nearest - 1, nearest, nearest + 1];
    let contained: boolean = false;
    for (const lift of images) {
      const lifted: Point = [point[0], point[1] + lift * (period ?? 0)];
      if (
        !Number.isSafeInteger(lift) ||
        !lifted.every(Number.isFinite) ||
        !chart.every((corner: Point): boolean => corner.every(Number.isFinite))
      )
        return "interior point cover is not representable";
      const signs: [number, number, number] = [
        orientAutoMovieSolidChart(chart[0]!, chart[1]!, lifted),
        orientAutoMovieSolidChart(chart[1]!, chart[2]!, lifted),
        orientAutoMovieSolidChart(chart[2]!, chart[0]!, lifted),
      ];
      if (signs.some((sign: number): boolean => sign < 0)) continue;
      if (contained)
        return "interior point has ambiguous periodic triangle occurrences";
      if (signs.filter((sign: number): boolean => sign === 0).length > 1)
        return "interior point coincides with another authoritative vertex";
      hits.push({ index, lift, signs });
      contained = true;
    }
  }
  return hits;
}

/** Unoriented identity of the existing diagonal, including its relative cover. */
function edgeKey(
  triangle: AutoMovieSolidMeshPlan.ITriangle,
  at: number,
): string {
  const next: number = (at + 1) % 3;
  const a: number = triangle.vertices[at]!;
  const b: number = triangle.vertices[next]!;
  const turn: number = triangle.lifts[next]! - triangle.lifts[at]!;
  return key(a, b, turn);
}

/** Remove only unconstrained neighbours needed for a visible, representable insertion fan. */
function cavity(vertices: ReadonlyMap<number, Point>, triangles: readonly AutoMovieSolidMeshPlan.ITriangle[], hits: readonly Hit[], constraints: ReadonlySet<string>, id: number, point: Point, period: number | undefined, indexed: boolean): AutoMovieSolidMeshPlan.ITriangle[] | string {
  const adjacency: Map<string, number[]> = new Map();
  for (let index: number = 0; index < triangles.length; index++) for (let k: number = 0; k < 3; k++) {
    const identity: string = edgeKey(triangles[index]!, k);
    const owners: number[] = adjacency.get(identity) ?? [];
    owners.push(index);
    if (owners.length > 2) return "interior cavity needs manifold original diagonal incidence";
    adjacency.set(identity, owners);
  }
  const selected: Map<number, Hit> = new Map();
  const boundary: Map<string, Boundary> = new Map();
  const pending: Boundary[] = [];
  const add: (hit: Hit) => string | undefined = (hit: Hit): string | undefined => {
    const previousHit: Hit | undefined = selected.get(hit.index);
    if (previousHit !== undefined) return previousHit.lift === hit.lift ? undefined : "interior cavity wraps into incompatible point sheets";
    selected.set(hit.index, hit);
    const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[hit.index]!;
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const edge: Boundary = { a: triangle.vertices[k]!, b: triangle.vertices[next]!, first: triangle.lifts[k]! - hit.lift, last: triangle.lifts[next]! - hit.lift };
      if (![edge.first, edge.last].every(Number.isSafeInteger)) return "interior cavity cover is not representable";
      const identity: string = key(edge.a, edge.b, edge.last - edge.first);
      const previous: Boundary | undefined = boundary.get(identity);
      if (previous !== undefined) {
        if (constraints.has(identity)) return "interior cavity would erase an original source constraint";
        if (previous.a !== edge.b || previous.b !== edge.a || previous.first !== edge.last || previous.last !== edge.first) return "interior cavity has incompatible directed cover incidence";
        boundary.delete(identity);
      } else {
        boundary.set(identity, edge);
        pending.push(edge);
      }
    }
    return undefined;
  };
  for (const hit of hits) {
    const failure: string | undefined = add(hit);
    if (failure !== undefined) return failure;
  }
  for (let cursor: number = 0; cursor < pending.length; cursor++) {
    const edge: Boundary = pending[cursor]!;
    const identity: string = key(edge.a, edge.b, edge.last - edge.first);
    if (boundary.get(identity) !== edge || admitted(vertices, edge, point, period, indexed)) continue;
    if (constraints.has(identity)) return "interior point has no represented strict triangle against a source constraint";
    const next: number | undefined = adjacency.get(identity)?.find((index: number): boolean => !selected.has(index));
    if (next === undefined) return "interior cavity cannot cross an unshared boundary";
    const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[next]!;
    const at: number = triangle.vertices.indexOf(edge.a);
    if (at < 0) return "interior cavity neighbour lost its shared original endpoint";
    const lift: number = triangle.lifts[at]! - edge.first;
    if (!Number.isSafeInteger(lift)) return "interior cavity point image is not representable";
    const failure: string | undefined = add({ index: next, lift, signs: [0, 0, 0] });
    if (failure !== undefined) return failure;
  }
  const retained: Set<string> = new Set();
  for (const edge of boundary.values()) {
    retained.add(`${edge.a}/${edge.first}`);
    retained.add(`${edge.b}/${edge.last}`);
  }
  for (const hit of selected.values()) for (let k: number = 0; k < 3; k++) {
    const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[hit.index]!;
    if (!retained.has(`${triangle.vertices[k]}/${triangle.lifts[k]! - hit.lift}`)) return "interior cavity would remove an original point occurrence";
  }
  const result: AutoMovieSolidMeshPlan.ITriangle[] = triangles.filter((_: AutoMovieSolidMeshPlan.ITriangle, index: number): boolean => !selected.has(index));
  for (const edge of boundary.values()) {
    const lifts: [number, number, number] = [0, edge.last - edge.first, -edge.first];
    if (!lifts.every(Number.isSafeInteger)) return "interior cavity output cover is not representable";
    result.push({ vertices: [edge.a, edge.b, id], lifts });
  }
  return result;
}

/** Every cavity edge must see the point, and its actual output triangle must have a represented strict interior. */
function admitted(vertices: ReadonlyMap<number, Point>, edge: Boundary, point: Point, period: number | undefined, indexed: boolean): boolean {
  const a: Point = vertices.get(edge.a)!;
  const b: Point = vertices.get(edge.b)!;
  const visibleA: Point = [a[0], a[1] + edge.first * (period ?? 0)];
  const visibleB: Point = [b[0], b[1] + edge.last * (period ?? 0)];
  if (![...visibleA, ...visibleB].every(Number.isFinite) || orientAutoMovieSolidChart(visibleA, visibleB, point) <= 0) return false;
  const points: Point[] = [a, [b[0], b[1] + (edge.last - edge.first) * (period ?? 0)], [point[0], point[1] - edge.first * (period ?? 0)]];
  if (!points.every((value: Point): boolean => value.every(Number.isFinite))) return false;
  const span: number = Math.max(points[0]![1], points[1]![1], points[2]![1]) - Math.min(points[0]![1], points[1]![1], points[2]![1]);
  if (period !== undefined && (span > period / 2 || (indexed && span === period / 2))) return false;
  const center: Point = [points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3, points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3];
  return center.every(Number.isFinite) && points.every((value: Point, index: number): boolean => orientAutoMovieSolidChart(value, points[(index + 1) % 3]!, center) > 0);
}

/** Canonical indexed edge identity retains the relative period turn. */
function key(a: number, b: number, turn: number): string {
  return a === b ? `${a}/${b}/${Math.abs(turn)}` : a < b ? `${a}/${b}/${turn}` : `${b}/${a}/${-turn}`;
}
