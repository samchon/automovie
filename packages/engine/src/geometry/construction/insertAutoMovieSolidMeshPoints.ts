import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshPlan } from "./AutoMovieSolidMeshPlan";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** One represented native chart coordinate. */
type Point = readonly [number, number];

/** A containing triangle and its occurrence in the inserted point's own cover. */
interface Hit {
  /** Triangle index before this insertion. */ index: number;

  /** The point's sheet in the triangle's stored cover: integer periods the stored cover adds to the point. */ lift: number;

  /** Three exact edge signs of the point's stored coordinates against `chart`. */ signs: [number, number, number];

  /** The triangle's corners in the point's cover: each stored phase plus its lift less `lift`, in periods. */ chart: Point[];
}

/**
 * Insert admitted residual grid points by splitting the triangles that contain them.
 *
 * Each kept point is located by the exact orientation signs of its
 * represented chart against every triangle occurrence. A point strictly
 * inside one triangle splits it into three; a point exactly on the relative
 * interior of a shared unconstrained diagonal splits the two triangles beside
 * it into four. This is the insertion step of Lawson's incremental
 * triangulation (Lawson 1977, Software for C1 surface interpolation) and of
 * Guibas and Stolfi's InsertSite (1985, ACM Transactions on Graphics 4(2));
 * de Berg et al. (2008, Computational Geometry, section 9.3) state the same
 * two cases. The Delaunay property is restored afterwards by the planner's
 * flips (`legalizeAutoMovieSolidMesh`), not here.
 *
 * Each new triangle is a containing triangle's side and the point, so its
 * orientation is that side's nonzero location sign: exactly positive however
 * thin. A residual grid's anti-diagonal is one chart line in intent, so three
 * of its points that differ only in their last places make such a sliver,
 * which may hold no representable interior point at all. Its membership in
 * the residual partition is its constraint-bounded region's, which the
 * planner reads (`AutoMovieSolidMeshPlan`); this owner samples no interior.
 * Requiring a represented interior point of every new triangle instead grew a
 * cavity across a thin triangle until it swallowed an interior vertex, or
 * met a constraint, and refused, though the exact split was valid.
 *
 * An exact predicate is consistent only on one fixed set of represented
 * coordinates (Shewchuk 1997, Adaptive precision floating-point arithmetic
 * and fast robust geometric predicates), and adding an integer number of
 * periods to a phase rounds, so the same three points read in two covers are
 * two sets. Every decision of one insertion is therefore read in one cover,
 * the inserted point's own: the point keeps its stored phase and each corner
 * stands at its lift relative to the point's sheet, a represented phase that
 * depends only on the corner and that relative lift. Two triangles that meet
 * the point in one sheet thus read their shared side at the same two
 * represented points, so the point is on that side in both or in neither.
 * Each new triangle is published in that same cover, the point first at lift
 * zero, the cover every consumer reads it in: its orientation there is the
 * location sign by construction and is not derived again. Locating in each
 * triangle's stored cover and rechecking each split in a cover that began at
 * the side's first corner read three covers: a grid node on a chord across
 * the phase seam stood 2^-52 rad inside the chord in the first and exactly on
 * it in the last, and the valid split was refused. The split triangles must
 * still span less than half a period in that cover (not exactly half when
 * indexed). Constraint vertices are left with the boundary owner. A point on
 * a source constraint or an unshared boundary has no authoritative
 * subdivision; a point on a vertex, outside the supplied triangles, in more
 * than two of them or in incompatible sheets of one diagonal is refused by
 * name, with its inserted chart and located triangles, before any result is
 * published.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Lawson's and Guibas and Stolfi's incremental insertion step: exact orientation signs locate the point, and the containing triangle splits into three, or the two beside an unconstrained diagonal into four. Location and publication share the inserted point's own cover, because exact signs agree only on one set of represented coordinates and a period shift rounds; each new triangle's orientation is a nonzero location sign there, and no represented interior point is required, so ulp-collinear grid points insert without a cavity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One index-only insertion between boundary ear triangulation and legalization; region membership belongs to the planner, flips to legalization, grid evaluation and boundary subdivision to their own owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Constructs, moves, welds or drops no point, flips or removes no source constraint, changes no period and compares no sign against a tolerance; a point on a constraint, a vertex or an unshared boundary, a nonmanifold location or a half-period split returns a named failure, never a partial result.
 * @evidence contracts/development/common.md#meaningful-documentation States the two split cases, why a thin triangle is valid, where its membership comes from, the one cover every sign and published triangle is read in and every refusal with its diagnostic.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each of M inserted points scans the T current triangles once to locate itself and writes a new array of T + 2 triangles: O(M(T+M)) time; the split itself is constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses original points, constraint keys and the located signs and corners; no source is evaluated, resampled or snapped, and no orientation is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Working triangles and identity sets take O(V+T+M) storage; input arrays, maps and the membership callback are borrowed for the call, and every returned triangle triple is caller-owned.
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
  const sourceEdges: Set<string> = new Set(
    constraints.map((edge: AutoMovieSolidMeshConstraints.ISegment): string =>
      key(edge.a, edge.b, edge.turn),
    ),
  );
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
    const located: Hit[] | string = locate(vertices, result, point, period);
    const hits: Hit[] = typeof located === "string" ? [] : located;

    /** A named refusal with the inserted point and the triangles that located it. */
    const refuse: (detail: string) => string = (detail: string): string =>
      describe(detail, vertices, result, hits, id, point, period, indexed);
    if (typeof located === "string") return refuse(located);
    if (hits.length === 0 || hits.length > 2)
      return refuse("kept interior point has no unique manifold containing population");

    // A zero sign names the side the point lies on; a strict interior point has none.
    const onEdges: number[] = hits.map((hit: Hit): number =>
      hit.signs.findIndex((sign: number): boolean => sign === 0),
    );
    if (hits.length === 1 && onEdges[0] !== -1)
      return refuse("interior point hits an unshared boundary without an authoritative subdivision");
    if (
      hits.length === 2 &&
      (onEdges.some((edge: number): boolean => edge === -1) ||
        edgeKey(result[hits[0]!.index]!, onEdges[0]!) !==
          edgeKey(result[hits[1]!.index]!, onEdges[1]!))
    )
      return refuse("interior point does not share one original diagonal");
    if (
      hits.length === 2 &&
      sourceEdges.has(edgeKey(result[hits[0]!.index]!, onEdges[0]!))
    )
      return refuse("interior point needs an authoritative source-edge subdivision");

    // Both triangles must meet the point in one sheet: the diagonal's first endpoint in one is the second in the other, both relative to the point.
    if (hits.length === 2) {
      const first: AutoMovieSolidMeshPlan.ITriangle = result[hits[0]!.index]!;
      const second: AutoMovieSolidMeshPlan.ITriangle = result[hits[1]!.index]!;
      if (
        first.lifts[onEdges[0]!]! - hits[0]!.lift !==
        second.lifts[(onEdges[1]! + 1) % 3]! - hits[1]!.lift
      )
        return refuse("interior point meets one diagonal in incompatible point sheets");
    }

    // Every side but the one the point lies on joins the point: three triangles inside, two on each side of a diagonal.
    const made: AutoMovieSolidMeshPlan.ITriangle[] = [];
    for (let h: number = 0; h < hits.length; h++)
      for (let k: number = 0; k < 3; k++) {
        if (k === onEdges[h]) continue;
        const triangle: AutoMovieSolidMeshPlan.ITriangle | string = side(
          result[hits[h]!.index]!,
          hits[h]!,
          k,
          id,
          point,
          period,
          indexed,
        );
        if (typeof triangle === "string") return refuse(triangle);
        made.push(triangle);
      }
    const split: Set<number> = new Set(
      hits.map((hit: Hit): number => hit.index),
    );
    result = result
      .filter(
        (_: AutoMovieSolidMeshPlan.ITriangle, index: number): boolean =>
          !split.has(index),
      )
      .concat(made);
    present.add(id);
  }
  return result;
}

/**
 * Locate every incident triangle by exact edge signs in the point's own cover: the point keeps its stored phase and each corner is
 * read at its lift relative to the point's sheet in that triangle. A corner's represented phase there depends only on its identity
 * and that relative lift, so two triangles that meet the point in one sheet read a shared side at the same two represented points.
 */
function locate(
  vertices: ReadonlyMap<number, Point>,
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  point: Point,
  period: number | undefined,
): Hit[] | string {
  const hits: Hit[] = [];
  for (let index: number = 0; index < triangles.length; index++) {
    const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[index]!;
    const first: number =
      vertices.get(triangle.vertices[0]!)![1] +
      triangle.lifts[0]! * (period ?? 0);
    const nearest: number =
      period === undefined ? 0 : Math.round((first - point[1]) / period);
    const images: number[] =
      period === undefined ? [0] : [nearest - 1, nearest, nearest + 1];
    let contained: boolean = false;
    for (const lift of images) {
      const chart: Point[] = triangle.vertices.map(
        (id: number, k: number): Point => [
          vertices.get(id)![0],
          vertices.get(id)![1] + (triangle.lifts[k]! - lift) * (period ?? 0),
        ],
      );
      if (
        !Number.isSafeInteger(lift) ||
        !triangle.lifts.every((corner: number): boolean =>
          Number.isSafeInteger(corner - lift),
        ) ||
        !point.every(Number.isFinite) ||
        !chart.every((corner: Point): boolean => corner.every(Number.isFinite))
      )
        return "interior point cover is not representable";
      const signs: [number, number, number] = [
        orientAutoMovieSolidChart(chart[0]!, chart[1]!, point),
        orientAutoMovieSolidChart(chart[1]!, chart[2]!, point),
        orientAutoMovieSolidChart(chart[2]!, chart[0]!, point),
      ];
      if (signs.some((sign: number): boolean => sign < 0)) continue;
      if (contained)
        return "interior point has ambiguous periodic triangle occurrences";
      if (signs.filter((sign: number): boolean => sign === 0).length > 1)
        return "interior point coincides with another authoritative vertex";
      hits.push({ index, lift, signs, chart });
      contained = true;
    }
  }
  return hits;
}

/**
 * The triangle from the point to a containing triangle's side `k`, published in the cover it was located in: the point first at
 * lift zero, the side's two corners at their lifts relative to the point's sheet. Its orientation there is the side's location
 * sign, already exactly positive, and its three represented corners are the located ones, so only the half-period span is read.
 */
function side(
  triangle: AutoMovieSolidMeshPlan.ITriangle,
  hit: Hit,
  k: number,
  id: number,
  point: Point,
  period: number | undefined,
  indexed: boolean,
): AutoMovieSolidMeshPlan.ITriangle | string {
  const next: number = (k + 1) % 3;
  const phases: number[] = [point[1], hit.chart[k]![1], hit.chart[next]![1]];
  const span: number = Math.max(...phases) - Math.min(...phases);
  if (
    period !== undefined &&
    (span > period / 2 || (indexed && span === period / 2))
  )
    return "interior split triangle spans half a period in its output cover";
  return {
    vertices: [id, triangle.vertices[k]!, triangle.vertices[next]!],
    lifts: [0, triangle.lifts[k]! - hit.lift, triangle.lifts[next]! - hit.lift],
  };
}

/** A refusal with the inserted point's identity and chart and each located triangle with its signs; nonfinite numbers are spelled out. */
function describe(
  detail: string,
  vertices: ReadonlyMap<number, Point>,
  triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  hits: readonly Hit[],
  id: number,
  point: Point,
  period: number | undefined,
  indexed: boolean,
): string {
  return detail + "; diagnostic=" + JSON.stringify({
    inserted: { id, chart: [...point] },
    period: period ?? null,
    indexed,
    hits: hits.map((hit: Hit): {
      index: number; vertices: number[]; lifts: number[]; charts: number[][]; lift: number; signs: number[]; cover: number[][];
    } => {
      const triangle: AutoMovieSolidMeshPlan.ITriangle = triangles[hit.index]!;
      return {
        index: hit.index,
        vertices: [...triangle.vertices],
        lifts: [...triangle.lifts],
        charts: triangle.vertices.map((corner: number): number[] => [...vertices.get(corner)!]),
        lift: hit.lift,
        signs: [...hit.signs],
        cover: hit.chart.map((corner: Point): number[] => [...corner]),
      };
    }),
  }, (_key: string, value: unknown): unknown =>
    typeof value === "number" && !Number.isFinite(value) ? "nonfinite:" + String(value) : value);
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

/** Canonical indexed edge identity retains the relative period turn. */
function key(a: number, b: number, turn: number): string {
  return a === b
    ? `${a}/${b}/${Math.abs(turn)}`
    : a < b
      ? `${a}/${b}/${turn}`
      : `${b}/${a}/${-turn}`;
}
