import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/*
 * Insert admitted residual grid points by splitting the triangles that contain
 * them.
 *
 * Each kept point is located by the exact orientation signs of its represented
 * chart against every triangle occurrence. A point strictly inside one triangle
 * splits it into three; a point exactly on the relative interior of a shared
 * unconstrained diagonal splits the two triangles beside it into four. This is
 * the insertion step of Lawson's incremental triangulation (Lawson 1977,
 * Software for C1 surface interpolation) and of Guibas and Stolfi's InsertSite
 * (1985, ACM Transactions on Graphics 4(2)); de Berg et al. (2008,
 * Computational Geometry, section 9.3) state the same two cases. The Delaunay
 * property is restored afterwards by the planner's flips
 * (`legalizeAutoMovieSolidMesh`), not here.
 *
 * Each new triangle is a containing triangle's side and the point, so its
 * orientation is that side's nonzero location sign. When one has no represented
 * strict centroid, a cavity may absorb adjacent triangles across unconstrained
 * sides to make a strict fan. If it reaches an authored constraint, an open
 * boundary or an original point it would remove, the exact split stands and the
 * planner reads membership from its constraint-bounded region
 * (regionAutoMovieSolidMesh).
 *
 * An exact predicate is consistent only on one fixed set of represented
 * coordinates (Shewchuk 1997, Adaptive precision floating-point arithmetic and
 * fast robust geometric predicates), and adding an integer number of periods to
 * a phase rounds, so the same three points read in two covers are two sets.
 * Every decision of one insertion is therefore read in one cover, the inserted
 * point's own: the point keeps its stored phase and each corner stands at its
 * lift relative to the point's sheet, a represented phase that depends only on
 * the corner and that relative lift. Two triangles that meet the point in one
 * sheet thus read their shared side at the same two represented points, so the
 * point is on that side in both or in neither. Each new triangle is published
 * in that same cover, the point first at lift zero, the cover every consumer
 * reads it in: its orientation there is the location sign by construction and
 * is not derived again. Locating in each triangle's stored cover and rechecking
 * each split in a cover that began at the side's first corner read three
 * covers: a grid node on a chord across the phase seam stood 2^-52 rad inside
 * the chord in the first and exactly on it in the last, and the valid split was
 * refused. The split triangles must still span less than half a period in that
 * cover (not exactly half when indexed). Constraint vertices are left with the
 * boundary owner. A point on a source constraint or an unshared boundary has no
 * authoritative subdivision; a point on a vertex, outside the supplied
 * triangles, in more than two of them or in incompatible sheets of one diagonal
 * is refused by name, with its inserted chart and located triangles, before any
 * result is published.
 */
export function insertAutoMovieSolidMeshPoints(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  keeps: (u: number, v: number) => boolean,
  period?: number,
  indexed: boolean = false,
): IAutoMovieSolidMeshPlan.ITriangle[] | string {
  if (period !== undefined && !(period > 0))
    return "interior insertion needs a finite positive period";
  const constrained: Set<number> = new Set(
    constraints.flatMap(
      (edge: IAutoMovieSolidMeshConstraints.ISegment): number[] => [
        edge.a,
        edge.b,
      ],
    ),
  );
  const sourceEdges: Set<string> = new Set(
    constraints.map((edge: IAutoMovieSolidMeshConstraints.ISegment): string =>
      key(edge.a, edge.b, edge.turn),
    ),
  );
  let result: IAutoMovieSolidMeshPlan.ITriangle[] = triangles.map(
    (
      triangle: IAutoMovieSolidMeshPlan.ITriangle,
    ): IAutoMovieSolidMeshPlan.ITriangle => ({
      vertices: [...triangle.vertices],
      lifts: [...triangle.lifts],
    }),
  );
  const present: Set<number> = new Set(
    result.flatMap(
      (triangle: IAutoMovieSolidMeshPlan.ITriangle): number[] =>
        triangle.vertices,
    ),
  );
  for (const entry of vertices) {
    const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
    if (present.has(id) || constrained.has(id) || !keeps(point[0], point[1]))
      continue;
    const located: Hit[] | string = locate(vertices, result, point, period);
    const hits: Hit[] = typeof located === "string" ? [] : located;

    /*
     * A named refusal with the inserted point and the triangles that located
     * it.
     */
    const refuse: (detail: string) => string = (detail: string): string =>
      describe(detail, vertices, result, hits, id, point, period, indexed);
    if (typeof located === "string") return refuse(located);
    if (hits.length === 0 || hits.length > 2)
      return refuse(
        "kept interior point has no unique manifold containing population",
      );

    // A zero sign names the side the point lies on; a strict interior point has none.
    const onEdges: number[] = hits.map((hit: Hit): number =>
      hit.signs.findIndex((sign: number): boolean => sign === 0),
    );
    if (hits.length === 1 && onEdges[0] !== -1)
      return refuse(
        "interior point hits an unshared boundary without an authoritative subdivision",
      );
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
      return refuse(
        "interior point needs an authoritative source-edge subdivision",
      );

    // Both triangles must meet the point in one sheet: the diagonal's first endpoint in one is the second in the other, both relative to the point.
    if (hits.length === 2) {
      const first: IAutoMovieSolidMeshPlan.ITriangle = result[hits[0]!.index]!;
      const second: IAutoMovieSolidMeshPlan.ITriangle = result[hits[1]!.index]!;
      if (
        first.lifts[onEdges[0]!]! - hits[0]!.lift !==
        second.lifts[(onEdges[1]! + 1) % 3]! - hits[1]!.lift
      )
        return refuse(
          "interior point meets one diagonal in incompatible point sheets",
        );
    }

    // Every side but the one the point lies on joins the point: three triangles inside, two on each side of a diagonal.
    const made: IAutoMovieSolidMeshPlan.ITriangle[] = [];
    for (let h: number = 0; h < hits.length; h++)
      for (let k: number = 0; k < 3; k++) {
        if (k === onEdges[h]) continue;
        const triangle: IAutoMovieSolidMeshPlan.ITriangle | string = side(
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
    const thin: boolean = made.some(
      (triangle: IAutoMovieSolidMeshPlan.ITriangle): boolean =>
        !admitted(
          vertices,
          {
            a: triangle.vertices[1]!,
            b: triangle.vertices[2]!,
            first: triangle.lifts[1]!,
            last: triangle.lifts[2]!,
          },
          point,
          period,
          indexed,
        ),
    );
    const expanded: IAutoMovieSolidMeshPlan.ITriangle[] | string | null = thin
      ? cavity(vertices, result, hits, sourceEdges, id, point, period, indexed)
      : null;
    if (typeof expanded === "string") return refuse(expanded);
    // A strict cavity cannot cross a source constraint or erase an original point. Keep
    // the exact split in that case; the planner reads its constraint region for membership.
    result =
      expanded ??
      result
        .filter(
          (_: IAutoMovieSolidMeshPlan.ITriangle, index: number): boolean =>
            !split.has(index),
        )
        .concat(made);
    present.add(id);
  }
  return result;
}

/*
 * One directed cavity edge in the inserted point's period cover.
 */
interface Boundary {
  /*
   * First original vertex ID.
   */
  a: number;

  /*
   * Last original vertex ID.
   */
  b: number;

  /*
   * Period lift of the first endpoint relative to the new point.
   */
  first: number;

  /*
   * Period lift of the last endpoint relative to the new point.
   */
  last: number;
}

/*
 * A containing triangle and its occurrence in the inserted point's own cover.
 */
interface Hit {
  /*
   * Triangle index before this insertion.
   */ index: number;

  /*
   * The point's sheet in the triangle's stored cover: integer periods the
   * stored cover adds to the point.
   */ lift: number;

  /*
   * Three exact edge signs of the point's stored coordinates against `chart`.
   */ signs: [
    number,
    number,
    number,
  ];

  /*
   * The triangle's corners in the point's cover: each stored phase plus its
   * lift less `lift`, in periods.
   */ chart: Readonly<AutoMovieVector2Tuple>[];
}

/*
 * Locate every incident triangle by exact edge signs in the point's own cover:
 * the point keeps its stored phase and each corner is read at its lift relative
 * to the point's sheet in that triangle. A corner's represented phase there
 * depends only on its identity and that relative lift, so two triangles that
 * meet the point in one sheet read a shared side at the same two represented
 * points.
 */
function locate(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  point: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
): Hit[] | string {
  const hits: Hit[] = [];
  for (let index: number = 0; index < triangles.length; index++) {
    const triangle: IAutoMovieSolidMeshPlan.ITriangle = triangles[index]!;
    const first: number =
      vertices.get(triangle.vertices[0]!)![1] +
      triangle.lifts[0]! * (period ?? 0);
    const nearest: number =
      period === undefined ? 0 : Math.round((first - point[1]) / period);
    const images: number[] =
      period === undefined ? [0] : [nearest - 1, nearest, nearest + 1];
    let contained: boolean = false;
    for (const lift of images) {
      const chart: Readonly<AutoMovieVector2Tuple>[] = triangle.vertices.map(
        (id: number, k: number): Readonly<AutoMovieVector2Tuple> => [
          vertices.get(id)![0],
          vertices.get(id)![1] + (triangle.lifts[k]! - lift) * (period ?? 0),
        ],
      );
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

/*
 * The triangle from the point to a containing triangle's side `k`, published in
 * the cover it was located in: the point first at lift zero, the side's two
 * corners at their lifts relative to the point's sheet. Its orientation there
 * is the side's location sign, already exactly positive, and its three
 * represented corners are the located ones, so only the half-period span is
 * read.
 */
function side(
  triangle: IAutoMovieSolidMeshPlan.ITriangle,
  hit: Hit,
  k: number,
  id: number,
  point: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
  indexed: boolean,
): IAutoMovieSolidMeshPlan.ITriangle | string {
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

/*
 * A refusal with the inserted point's identity and chart and each located
 * triangle with its signs; nonfinite numbers are spelled out.
 */
function describe(
  detail: string,
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  hits: readonly Hit[],
  id: number,
  point: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
  indexed: boolean,
): string {
  return (
    detail +
    "; diagnostic=" +
    JSON.stringify(
      {
        inserted: { id, chart: [...point] },
        period: period ?? null,
        indexed,
        hits: hits.map(
          (
            hit: Hit,
          ): {
            index: number;
            vertices: number[];
            lifts: number[];
            charts: number[][];
            lift: number;
            signs: number[];
            cover: number[][];
          } => {
            const triangle: IAutoMovieSolidMeshPlan.ITriangle =
              triangles[hit.index]!;
            return {
              index: hit.index,
              vertices: [...triangle.vertices],
              lifts: [...triangle.lifts],
              charts: triangle.vertices.map((corner: number): number[] => [
                ...vertices.get(corner)!,
              ]),
              lift: hit.lift,
              signs: [...hit.signs],
              cover: hit.chart.map(
                (corner: Readonly<AutoMovieVector2Tuple>): number[] => [
                  ...corner,
                ],
              ),
            };
          },
        ),
      },
      (_key: string, value: unknown): unknown => value,
    )
  );
}

/*
 * Unoriented identity of the existing diagonal, including its relative cover.
 */
function edgeKey(
  triangle: IAutoMovieSolidMeshPlan.ITriangle,
  at: number,
): string {
  const next: number = (at + 1) % 3;
  const a: number = triangle.vertices[at]!;
  const b: number = triangle.vertices[next]!;
  const turn: number = triangle.lifts[next]! - triangle.lifts[at]!;
  return key(a, b, turn);
}

/*
 * Canonical indexed edge identity retains the relative period turn.
 */
function key(a: number, b: number, turn: number): string {
  return a === b
    ? `${a}/${b}/${Math.abs(turn)}`
    : a < b
      ? `${a}/${b}/${turn}`
      : `${b}/${a}/${-turn}`;
}

/*
 * Remove only unconstrained neighbours needed for a visible, representable
 * insertion fan.
 */
function cavity(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  hits: readonly Hit[],
  constraints: ReadonlySet<string>,
  id: number,
  point: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
  indexed: boolean,
): IAutoMovieSolidMeshPlan.ITriangle[] | string | null {
  const adjacency: Map<string, number[]> = new Map();
  for (let index: number = 0; index < triangles.length; index++)
    for (let k: number = 0; k < 3; k++) {
      const identity: string = edgeKey(triangles[index]!, k);
      const owners: number[] = adjacency.get(identity) ?? [];
      owners.push(index);
      if (owners.length > 2)
        return "interior cavity needs manifold original diagonal incidence";
      adjacency.set(identity, owners);
    }
  const selected: Map<number, Pick<Hit, "index" | "lift">> = new Map();
  const boundary: Map<string, Boundary> = new Map();
  const pending: Boundary[] = [];
  const add: (hit: Pick<Hit, "index" | "lift">) => string | undefined = (
    hit: Pick<Hit, "index" | "lift">,
  ): string | undefined => {
    const previousHit: Pick<Hit, "index" | "lift"> | undefined = selected.get(
      hit.index,
    );
    if (previousHit !== undefined)
      return previousHit.lift === hit.lift
        ? undefined
        : "interior cavity wraps into incompatible point sheets";
    selected.set(hit.index, hit);
    const triangle: IAutoMovieSolidMeshPlan.ITriangle = triangles[hit.index]!;
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const edge: Boundary = {
        a: triangle.vertices[k]!,
        b: triangle.vertices[next]!,
        first: triangle.lifts[k]! - hit.lift,
        last: triangle.lifts[next]! - hit.lift,
      };
      const identity: string = key(edge.a, edge.b, edge.last - edge.first);
      const previous: Boundary | undefined = boundary.get(identity);
      if (previous !== undefined) {
        if (constraints.has(identity))
          return "interior cavity would erase an original source constraint";
        if (
          previous.a !== edge.b ||
          previous.b !== edge.a ||
          previous.first !== edge.last ||
          previous.last !== edge.first
        )
          return "interior cavity has incompatible directed cover incidence";
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
    if (
      boundary.get(identity) !== edge ||
      admitted(vertices, edge, point, period, indexed)
    )
      continue;
    if (constraints.has(identity)) return null;
    const next: number | undefined = adjacency
      .get(identity)
      ?.find((index: number): boolean => !selected.has(index));
    if (next === undefined) return null;
    const triangle: IAutoMovieSolidMeshPlan.ITriangle = triangles[next]!;
    const at: number = triangle.vertices.indexOf(edge.a);
    if (at < 0)
      return "interior cavity neighbour lost its shared original endpoint";
    const lift: number = triangle.lifts[at]! - edge.first;
    const failure: string | undefined = add({
      index: next,
      lift,
    });
    if (failure !== undefined) return failure;
  }
  const retained: Set<string> = new Set();
  for (const edge of boundary.values()) {
    retained.add(`${edge.a}/${edge.first}`);
    retained.add(`${edge.b}/${edge.last}`);
  }
  for (const hit of selected.values())
    for (let k: number = 0; k < 3; k++) {
      const triangle: IAutoMovieSolidMeshPlan.ITriangle = triangles[hit.index]!;
      if (
        !retained.has(
          `${triangle.vertices[k]}/${triangle.lifts[k]! - hit.lift}`,
        )
      )
        return null;
    }
  const result: IAutoMovieSolidMeshPlan.ITriangle[] = triangles.filter(
    (_: IAutoMovieSolidMeshPlan.ITriangle, index: number): boolean =>
      !selected.has(index),
  );
  for (const edge of boundary.values()) {
    const lifts: [number, number, number] = [0, edge.first, edge.last];
    result.push({ vertices: [id, edge.a, edge.b], lifts });
  }
  return result;
}

/*
 * Every cavity edge must see the point, and its actual output triangle must
 * have a represented strict interior.
 */
function admitted(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edge: Boundary,
  point: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
  indexed: boolean,
): boolean {
  const a: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.a)!;
  const b: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.b)!;
  const visibleA: Readonly<AutoMovieVector2Tuple> = [
    a[0],
    a[1] + edge.first * (period ?? 0),
  ];
  const visibleB: Readonly<AutoMovieVector2Tuple> = [
    b[0],
    b[1] + edge.last * (period ?? 0),
  ];
  if (orientAutoMovieSolidChart(visibleA, visibleB, point) <= 0) return false;
  const points: Readonly<AutoMovieVector2Tuple>[] = [point, visibleA, visibleB];
  const span: number =
    Math.max(points[0]![1], points[1]![1], points[2]![1]) -
    Math.min(points[0]![1], points[1]![1], points[2]![1]);
  if (
    period !== undefined &&
    (span > period / 2 || (indexed && span === period / 2))
  )
    return false;
  const center: Readonly<AutoMovieVector2Tuple> = [
    points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3,
    points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3,
  ];
  return points.every(
    (value: Readonly<AutoMovieVector2Tuple>, index: number): boolean =>
      orientAutoMovieSolidChart(value, points[(index + 1) % 3]!, center) > 0,
  );
}
