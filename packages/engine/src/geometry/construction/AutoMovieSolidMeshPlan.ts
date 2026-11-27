import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

import { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import { insertAutoMovieSolidMeshPoints } from "./internal/insertAutoMovieSolidMeshPoints";
import { legalizeAutoMovieSolidMesh } from "./internal/legalizeAutoMovieSolidMesh";
import { orientAutoMovieSolidChart } from "./internal/orientAutoMovieSolidChart";
import { probeAutoMovieSolidMesh } from "./internal/probeAutoMovieSolidMesh";
import { regionAutoMovieSolidMesh } from "./internal/regionAutoMovieSolidMesh";
import { triangulateAutoMovieSolidBoundary } from "./internal/triangulateAutoMovieSolidBoundary";
import { witnessAutoMovieSolidChartTriangle } from "./internal/witnessAutoMovieSolidChartTriangle";

/**
 * One possible straight visibility edge, ordered by original endpoint IDs and
 * turn.
 */
type Candidate = IAutoMovieSolidMeshConstraints.ISegment;

/** A kept left boundary, classified in its own finite native cover. */
interface Component {
  /** Directed original-ID occurrences and cover lifts. */ walk: IAutoMovieSolidMeshIncidence.IWalk;
  /** Whether the finite left probe is inside this zero-winding boundary. */ outer: boolean;
}

/**
 * A finite visibility triangulation of an indexed native-chart partition.
 *
 * Boundary segments, including retained-grid boundaries, already describe the
 * source partition. Their subdivision preserves authoritative IDs. Visible
 * bridges join kept boundary components without crossing any existing edge or
 * passing through a third vertex; each resulting boundary is ear-triangulated,
 * kept interior points are inserted, and every free diagonal is then flipped
 * until the plan is the constrained Delaunay triangulation in the caller's
 * uniform metric (`legalizeAutoMovieSolidMesh`), so a dense rail keeps no
 * triangle of its own consecutive vertices. The finished triangles are read
 * against the residual membership once per constraint-bounded region
 * (`regionAutoMovieSolidMesh`): each triangle with a represented strict
 * centroid is sampled and must be kept, and an exactly positive triangle too
 * thin for one, which an exact insertion split of ulp-collinear grid points
 * makes, takes its region's reading. A region with no sampled triangle is a
 * named failure. Each bridge is the shortest visible one in the caller's
 * uniform metric, the legalization's own, so it joins its components where they
 * stand closest (matching phase across a periodic band); original endpoint IDs
 * and the integer turn only break exact ties. The metric's phase scale carries
 * the length unit, so the choice is unchanged by length units. This is a final
 * index plan: it evaluates no surface and constructs no point.
 *
 * Periodic visibility uses the shortest phase images (both at a half-period
 * tie). An untriangulated kept component is a named search failure, not a proof
 * of an invalid source or permission to omit that component. This finite
 * local-image search is not a complete solver for arbitrary spiral regions.
 */
export namespace AutoMovieSolidMeshPlan {
  /**
   * Plan every kept triangular face or return the failed visibility premise.
   *
   * @param vertices Existing indexed positions; no coordinate is changed.
   * @param constraints Original boundary primitives in their native cover.
   * @param keeps Interior membership of the desired residual source partition.
   * @param period Positive phase period, absent for a planar chart.
   * @param indexed Whether the consumer drops explicit lifts into a global
   *   index buffer; then half-period ties are unavailable.
   * @param occupied Immutable prior global endpoint-pair keys `minID/maxID`;
   *   new interior bridges/ears cannot reuse them. Existing source boundaries
   *   retain their identities and final global incidence belongs to the
   *   caller.
   * @param scale Phase scale of the uniform metric the bridges are chosen and
   *   the free diagonals legalized in, positive and finite, length units per
   *   radian; 1 reads the chart as given.
   * @param local A quadrilateral's own first fundamental form from its vertex
   *   IDs and chart points, `[shear, scale]`, which legalization reads in place
   *   of `scale` (`legalizeAutoMovieSolidMesh`); absent, the free diagonals are
   *   legalized in `scale` too.
   * @returns Positive native-chart index triples with split-source provenance,
   *   or a named construction failure.
   */
  export function triangulate(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    keeps: (u: number, v: number) => boolean,
    period?: number,
    indexed: boolean = false,
    occupied?: ReadonlySet<string>,
    scale: number = 1,
    local?: (
      ids: readonly number[],
      charts: readonly [number, number][],
    ) => [number, number],
  ): IAutoMovieSolidMeshPlan.IPlan | string {
    const split: IAutoMovieSolidMeshConstraints.IEdge[] | string =
      AutoMovieSolidMeshConstraints.split(vertices, constraints, period);
    if (typeof split === "string") return split;
    const edges: IAutoMovieSolidMeshConstraints.ISegment[] = [...split];
    if (vertices.size === 0) return { triangles: [], constraints: split };

    let boundaries: Component[] | string = components(
      vertices,
      edges,
      keeps,
      period,
    );
    if (typeof boundaries === "string") return boundaries;
    while (
      boundaries.some((component: Component): boolean => !component.outer)
    ) {
      const selected: number = boundaries.findIndex(
        (component: Component): boolean => !component.outer,
      );
      const joined: Candidate | string = bridge(
        vertices,
        edges,
        boundaries,
        selected,
        keeps,
        period,
        occupied,
        scale,
      );
      if (typeof joined === "string") return joined;
      edges.push(joined);
      const next: Component[] | string = components(
        vertices,
        edges,
        keeps,
        period,
      );
      if (typeof next === "string") return next;
      if (next.length >= boundaries.length)
        return "visibility bridge did not merge kept boundary components";
      boundaries = next;
    }
    const triangles: IAutoMovieSolidMeshPlan.ITriangle[] = [];
    for (const component of boundaries) {
      const made: IAutoMovieSolidMeshPlan.ITriangle[] | string =
        triangulateAutoMovieSolidBoundary(
          vertices,
          component.walk,
          period,
          indexed,
          occupied,
        );
      if (typeof made === "string") return made;
      for (const triangle of made) {
        const points: Readonly<AutoMovieVector2Tuple>[] = triangle.vertices.map(
          (id: number, index: number): Readonly<AutoMovieVector2Tuple> => [
            vertices.get(id)![0],
            vertices.get(id)![1] + triangle.lifts[index]! * (period ?? 0),
          ],
        );
        const probe: Readonly<AutoMovieVector2Tuple> | string =
          centroid(points);
        if (typeof probe === "string")
          return `boundary ear: ${probe}; original vertices ${triangle.vertices.join("/")}; cover ${JSON.stringify(points)}`;
        if (!keeps(probe[0], probe[1]))
          return `native ear left the kept source partition; triangle ${JSON.stringify({ vertices: triangle.vertices, lifts: triangle.lifts, cover: points, probe })}`;
        triangles.push(triangle);
      }
    }
    const inserted: IAutoMovieSolidMeshPlan.ITriangle[] | string =
      insertAutoMovieSolidMeshPoints(
        vertices,
        split,
        triangles,
        keeps,
        period,
        indexed,
      );
    if (typeof inserted === "string") return inserted;
    const legal: IAutoMovieSolidMeshPlan.ITriangle[] | string =
      legalizeAutoMovieSolidMesh(
        vertices,
        split,
        inserted,
        period,
        indexed,
        occupied,
        scale,
        local,
      );
    if (typeof legal === "string") return legal;

    // Membership is read once per constraint-bounded region (regionAutoMovieSolidMesh): every triangle with a represented strict centroid
    // is sampled and must be kept, and a triangle too thin for one, which an exact split may make, takes its region's sampled reading.
    const regions: number[] = regionAutoMovieSolidMesh(legal, split);
    const covers: Readonly<AutoMovieVector2Tuple>[][] = legal.map(
      (
        triangle: IAutoMovieSolidMeshPlan.ITriangle,
      ): Readonly<AutoMovieVector2Tuple>[] =>
        triangle.vertices.map(
          (id: number, k: number): Readonly<AutoMovieVector2Tuple> => [
            vertices.get(id)![0],
            vertices.get(id)![1] + triangle.lifts[k]! * (period ?? 0),
          ],
        ),
    );
    const sampled: Set<number> = new Set();
    for (let index: number = 0; index < legal.length; index++) {
      const probe: Readonly<AutoMovieVector2Tuple> | string = centroid(
        covers[index]!,
      );
      if (typeof probe === "string") continue;
      if (!keeps(probe[0], probe[1]))
        return `inserted triangle left the kept source partition; triangle ${JSON.stringify({ vertices: legal[index]!.vertices, lifts: legal[index]!.lifts, cover: covers[index], probe })}`;
      sampled.add(regions[index]!);
    }
    const unread: number = regions.findIndex(
      (region: number): boolean => !sampled.has(region),
    );
    if (unread >= 0)
      return `inserted grid triangle: visibility triangle has no represented strict centroid, nor any triangle of its constraint-bounded region; original vertices ${legal[unread]!.vertices.join("/")}; cover ${JSON.stringify(covers[unread])}`;
    return { triangles: legal, constraints: split };
  }
}

/**
 * Kept left boundary components; exact ray parity distinguishes finite outer
 * walks from holes.
 */
function components(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  keeps: (u: number, v: number) => boolean,
  period: number | undefined,
): Component[] | string {
  const walks: IAutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(vertices, edges, period);
  if (typeof walks === "string") return walks;
  const result: Component[] = [];
  for (const walk of walks) {
    const points: Readonly<AutoMovieVector2Tuple>[] = walk.vertices.map(
      (id: number, index: number): Readonly<AutoMovieVector2Tuple> => [
        vertices.get(id)![0],
        vertices.get(id)![1] + walk.lifts[index]! * (period ?? 0),
      ],
    );
    if (
      walk.winding === 0 &&
      points.length === 3 &&
      new Set(walk.vertices).size === 3 &&
      orientAutoMovieSolidChart(points[0]!, points[1]!, points[2]!) > 0
    ) {
      const strict: Readonly<AutoMovieVector2Tuple> | string = centroid(points);
      if (typeof strict === "string")
        return `arrangement face: ${strict}; original vertices ${walk.vertices.join("/")}; cover ${JSON.stringify(points)}`;
    }
    const probe: Readonly<AutoMovieVector2Tuple> | string =
      probeAutoMovieSolidMesh(vertices, edges, walk, period);
    if (typeof probe === "string") return probe;
    if (!keeps(probe[0], probe[1])) continue;
    let inside: boolean = false;
    if (walk.winding === 0)
      for (let k: number = 0; k < points.length; k++) {
        const a: Readonly<AutoMovieVector2Tuple> = points[k]!;
        const b: Readonly<AutoMovieVector2Tuple> =
          points[(k + 1) % points.length]!;
        if (
          a[1] > probe[1] !== b[1] > probe[1] &&
          orientAutoMovieSolidChart(a, b, probe) * (b[1] > a[1] ? 1 : -1) > 0
        )
          inside = !inside;
      }
    result.push({ walk, outer: walk.winding === 0 && inside });
  }
  return result;
}

/**
 * The shortest visible bridge from the selected component to any other, in the
 * face's uniform metric: `du^2 + (scale dv)^2`, the same metric the free
 * diagonals are legalized in (`legalizeAutoMovieSolidMesh`; George and
 * Borouchaki 1998), so a bridge joins its two boundaries where they stand
 * closest on the surface. On a periodic annulus (a station band between two
 * winding cycles) that is the pair at matching phase, a bridge straight across
 * the band. Original IDs and the turn only break exact length ties, for a
 * deterministic choice.
 *
 * Choosing by ID order instead (the earlier rule) let two cycles whose smallest
 * IDs stand half a period apart be bridged by a half-period diagonal: the ears
 * beside it then span more than half a period, which the cover rule refuses,
 * and the face was left untriangulated (a split band, 2026-11-08).
 *
 * The search is exact without ranking every pair: first each selected vertex's
 * own shortest candidate, those few ranked by length (then IDs and turn) and
 * tested for visibility in that order; then every other candidate strictly
 * shorter than the first visible one found, ranked the same way, since only
 * such a candidate could still beat it. Each candidate keeps the shortest phase
 * image allowed (both at a half-period tie, as before).
 */
function bridge(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  boundaries: readonly Component[],
  selected: number,
  keeps: (u: number, v: number) => boolean,
  period: number | undefined,
  occupied: ReadonlySet<string> | undefined,
  scale: number,
): Candidate | string {
  type Ranked = { candidate: Candidate; length: number };
  /**
   * Whether a pair already holds a prior global edge, which no bridge may
   * reuse.
   */
  const taken: (a: number, b: number) => boolean = (
    a: number,
    b: number,
  ): boolean => occupied?.has(`${Math.min(a, b)}/${Math.max(a, b)}`) === true;
  /**
   * Visit every candidate of a pair that may hold a bridge, with its squared
   * metric length; a string stops the visit. A taken pair is no candidate, but
   * the visitor asks `taken` itself, and only of a candidate it would keep: the
   * pairs are the product of two boundaries' vertices, and keying every one of
   * them cost more than the search. A pair whose image cannot be represented is
   * refused only when it is not taken, as before.
   */
  const each: (
    visit: (a: number, b: number, turn: number, length: number) => void,
  ) => string | null = (
    visit: (a: number, b: number, turn: number, length: number) => void,
  ): string | null => {
    const span: number = period ?? 0;
    for (const a of boundaries[selected]!.walk.vertices) {
      const first: Readonly<AutoMovieVector2Tuple> = vertices.get(a)!;
      for (let j: number = 0; j < boundaries.length; j++) {
        if (j === selected) continue;
        for (const b of boundaries[j]!.walk.vertices) {
          if (a === b) continue;
          const last: Readonly<AutoMovieVector2Tuple> = vertices.get(b)!;
          const nearest: number =
            period === undefined
              ? 0
              : Math.round((first[1] - last[1]) / period);
          for (
            let turn: number = period === undefined ? 0 : nearest - 1;
            turn <= (period === undefined ? 0 : nearest + 1);
            turn++
          ) {
            const phase: number = last[1] + turn * span;
            if (period !== undefined && Math.abs(phase - first[1]) > period / 2)
              continue;
            const length: number =
              (last[0] - first[0]) ** 2 + (scale * (phase - first[1])) ** 2;
            visit(a, b, turn, length);
          }
        }
      }
    }
    return null;
  };
  /**
   * Whether a candidate comes strictly before a ranked one in the exact total
   * order.
   */
  const sooner: (
    a: number,
    b: number,
    turn: number,
    length: number,
    than: Ranked,
  ) => boolean = (
    a: number,
    b: number,
    turn: number,
    length: number,
    than: Ranked,
  ): boolean =>
    (length - than.length ||
      a - than.candidate.a ||
      b - than.candidate.b ||
      turn - than.candidate.turn) < 0;
  /** The exact total order: length, then IDs and turn. */
  const before: (x: Ranked, y: Ranked) => number = (
    x: Ranked,
    y: Ranked,
  ): number =>
    x.length - y.length ||
    x.candidate.a - y.candidate.a ||
    x.candidate.b - y.candidate.b ||
    x.candidate.turn - y.candidate.turn;
  /** The first admitted bridge of a ranked list, or a refusal string, or null. */
  const admit: (list: Ranked[]) => Ranked | string | null = (
    list: Ranked[],
  ): Ranked | string | null => {
    list.sort(before);
    for (const ranked of list) {
      const candidate: Candidate = ranked.candidate;
      const first: Readonly<AutoMovieVector2Tuple> = vertices.get(candidate.a)!;
      const last: Readonly<AutoMovieVector2Tuple> = vertices.get(candidate.b)!;
      const end: Readonly<AutoMovieVector2Tuple> = [
        last[0],
        last[1] + candidate.turn * (period ?? 0),
      ];
      const visible: boolean | string = clear(
        vertices,
        edges,
        candidate,
        period,
      );
      if (typeof visible === "string") return visible;
      if (!visible) continue;
      const middle: Readonly<AutoMovieVector2Tuple> = midpoint(first, end);
      if (
        (middle[0] === first[0] && middle[1] === first[1]) ||
        (middle[0] === end[0] && middle[1] === end[1])
      )
        continue;
      if (!on(first, end, middle)) {
        const witness: boolean | string = witnessAutoMovieSolidChartTriangle(
          vertices,
          edges,
          candidate,
          middle,
          period,
        );
        if (typeof witness === "string") return witness;
        if (!witness) continue;
      }
      if (keeps(middle[0], middle[1])) return ranked;
    }
    return null;
  };

  // Each selected vertex's own shortest candidate.
  const own: Map<number, Ranked> = new Map();
  const failed: string | null = each(
    (a: number, b: number, turn: number, length: number): void => {
      const known: Ranked | undefined = own.get(a);
      if (known !== undefined && !sooner(a, b, turn, length, known)) return;
      if (taken(a, b)) return;
      own.set(a, { candidate: { a, b, turn }, length });
    },
  );
  if (failed !== null) return failed;
  const label: (c: Candidate) => string = (c: Candidate): string =>
    `${c.a}/${c.b}/${c.turn}`;
  const tested: Set<string> = new Set(
    [...own.values()].map((r: Ranked): string => label(r.candidate)),
  );
  const found: Ranked | string | null = admit([...own.values()]);
  if (typeof found === "string") return found;

  // Every other candidate that could still be shorter than it.
  const shorter: Ranked[] = [];
  each((a: number, b: number, turn: number, length: number): void => {
    if (found !== null && !sooner(a, b, turn, length, found)) return;
    if (taken(a, b)) return;
    const candidate: Candidate = { a, b, turn };
    if (!tested.has(label(candidate))) shorter.push({ candidate, length });
  });
  const better: Ranked | string | null = admit(shorter);
  if (typeof better === "string") return better;
  const chosen: Ranked | null = better ?? found;
  return chosen === null
    ? "visibility left a kept boundary without an admitted component bridge"
    : chosen.candidate;
}

/**
 * A strict represented centroid, never a silent empty-face classification at
 * rounded boundaries.
 */
function centroid(
  points: readonly Readonly<AutoMovieVector2Tuple>[],
): Readonly<AutoMovieVector2Tuple> | string {
  const point: Readonly<AutoMovieVector2Tuple> = [
    points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3,
    points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3,
  ];
  return points.every(
    (corner: Readonly<AutoMovieVector2Tuple>, index: number): boolean =>
      orientAutoMovieSolidChart(corner, points[(index + 1) % 3]!, point) > 0,
  )
    ? point
    : "visibility triangle has no represented strict centroid";
}

/** Identity of an unoriented edge, including its relative cover turn. */
function key(edge: IAutoMovieSolidMeshConstraints.ISegment): string {
  return edge.a < edge.b || (edge.a === edge.b && edge.turn > 0)
    ? `${edge.a}/${edge.b}/${edge.turn}`
    : `${edge.b}/${edge.a}/${-edge.turn}`;
}

/** A finite midpoint without adding two potentially large coordinates. */
function midpoint(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
): Readonly<AutoMovieVector2Tuple> {
  return [
    a[0] === b[0] ? a[0] : a[0] / 2 + b[0] / 2,
    a[1] === b[1] ? a[1] : a[1] / 2 + b[1] / 2,
  ];
}

/**
 * Neighbour images cover comparisons with shortest-image visibility edges and
 * one-period primitives.
 */
function images(
  value: number,
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: Readonly<AutoMovieVector2Tuple> = midpoint(a, b);
  const nearest: number = Math.round((middle[1] - value) / period);
  return [nearest - 1, nearest, nearest + 1];
}

/** Exact closed segment membership on the represented native points. */
function on(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  p: Readonly<AutoMovieVector2Tuple>,
): boolean {
  return (
    p[0] >= Math.min(a[0], b[0]) &&
    p[0] <= Math.max(a[0], b[0]) &&
    p[1] >= Math.min(a[1], b[1]) &&
    p[1] <= Math.max(a[1], b[1]) &&
    orientAutoMovieSolidChart(a, b, p) === 0
  );
}

/** Refuse third vertices, edge intersections and coincident existing diagonals. */
function clear(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  candidate: IAutoMovieSolidMeshConstraints.ISegment,
  period: number | undefined,
): boolean | string {
  const a: Readonly<AutoMovieVector2Tuple> = vertices.get(candidate.a)!;
  const stored: Readonly<AutoMovieVector2Tuple> = vertices.get(candidate.b)!;
  const b: Readonly<AutoMovieVector2Tuple> = [
    stored[0],
    stored[1] + candidate.turn * (period ?? 0),
  ];
  if (a[0] === b[0] && a[1] === b[1]) return false;
  for (const entry of vertices) {
    const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
    const shifts: number[] | null = images(point[1], a, b, period);
    if (shifts === null)
      return "visibility vertex cover image is not representable";
    for (const turn of shifts) {
      if (
        (id === candidate.a && turn === 0) ||
        (id === candidate.b && turn === candidate.turn)
      )
        continue;
      const lifted: Readonly<AutoMovieVector2Tuple> = [
        point[0],
        point[1] + turn * (period ?? 0),
      ];
      if (on(a, b, lifted)) return false;
    }
  }
  for (const edge of edges) {
    if (key(edge) === key(candidate)) return false;
    const first: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.a)!;
    const last: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.b)!;
    const shifts: number[] | null = images(first[1], a, b, period);
    if (shifts === null)
      return "visibility edge cover image is not representable";
    for (const turn of shifts) {
      const c: Readonly<AutoMovieVector2Tuple> = [
        first[0],
        first[1] + turn * (period ?? 0),
      ];
      const d: Readonly<AutoMovieVector2Tuple> = [
        last[0],
        last[1] + (turn + edge.turn) * (period ?? 0),
      ];
      if (
        orientAutoMovieSolidChart(a, b, c) *
          orientAutoMovieSolidChart(a, b, d) <
          0 &&
        orientAutoMovieSolidChart(c, d, a) *
          orientAutoMovieSolidChart(c, d, b) <
          0
      )
        return false;
    }
  }
  return true;
}
