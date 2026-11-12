import { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import { insertAutoMovieSolidMeshPoints } from "./insertAutoMovieSolidMeshPoints";
import { legalizeAutoMovieSolidMesh } from "./legalizeAutoMovieSolidMesh";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";
import { probeAutoMovieSolidMesh } from "./probeAutoMovieSolidMesh";
import { triangulateAutoMovieSolidBoundary } from "./triangulateAutoMovieSolidBoundary";
import { witnessAutoMovieSolidChartTriangle } from "./witnessAutoMovieSolidChartTriangle";

/** One finite native-chart position. */
type Point = readonly [number, number];

/** One possible straight visibility edge, ordered by original endpoint IDs and turn. */
type Candidate = AutoMovieSolidMeshConstraints.ISegment;

/** A kept left boundary, classified in its own finite native cover. */
interface Component {
  /** Directed original-ID occurrences and cover lifts. */ walk: AutoMovieSolidMeshIncidence.IWalk;
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
 * triangle of its own consecutive vertices.
 * Each bridge is the shortest visible one in the caller's uniform metric,
 * the legalization's own, so it joins its components where they stand
 * closest (matching phase across a periodic band); original endpoint IDs and
 * the integer turn only break exact ties. The metric's phase scale carries
 * the length unit, so the choice is unchanged by length units.
 * This is a final index plan: it evaluates no surface and constructs no point.
 *
 * Periodic visibility uses the shortest phase images (both at a half-period
 * tie). An untriangulated kept component is a named search failure, not a
 * proof of an invalid source or permission to omit that component. This finite
 * local-image search is not a complete solver for arbitrary spiral regions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shortest-image search limit, kept-component failure, positive chart order and absence of surface construction.
 * @evidence contracts/development/design.md#principled-representation Represents A finite visibility triangulation of an indexed native-chart partition: companion namespace of 3 members (`ITriangle`, `IPlan`, `triangulate`); units and frames named in its text: world, radian. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidMeshPlan` in packages/engine/src/geometry/construction/AutoMovieSolidMeshPlan.ts; its surface is the 3 members listed and the text shows 11 other files naming it, mostly packages/engine (6), test (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidMeshPlan {
  /**
   * An oriented triangle, with its actual native-cover occurrence at each corner.
   *
   * @evidence contracts/development/design.md#principled-representation Original IDs describe shared geometry while integer lifts retain the periodic face embedding used to prove positive chart orientation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two parallel triples distinguish mesh identity from cover occurrence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not reconstruct a half-period tie from global IDs or infer shared geometry from coordinate coincidence.
   * @evidence contracts/development/common.md#meaningful-documentation The first lift is zero; coordinates add lift times period before reading chart orientation.
   */
  export interface ITriangle {
    /** Original shared mesh indices in positive native-chart order. */
    vertices: [number, number, number];

    /** Integer phase periods added at each corner, beginning at zero. */
    lifts: [number, number, number];
  }

  /**
   * A completed index plan and the original constraints' subdivision history.
   *
   * @evidence contracts/development/design.md#principled-representation Triangles retain original IDs and cover lifts; split constraints retain source-edge indices so an endpoint boundary is distinguished from a trim or retained-cell boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Explicit result data carries topology and provenance without a registry or repeating the split operation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Provenance does not certify world geometry or classify every unpaired edge as an endpoint.
   * @evidence contracts/development/common.md#meaningful-documentation States index, lift and source-edge ownership and the endpoint-classification limit.
   */
  export interface IPlan {
    /** Positive native-chart triangle occurrences. */ triangles: ITriangle[];
    /** Subdivided original constraints with source-edge provenance. */ constraints: AutoMovieSolidMeshConstraints.IEdge[];
  }

  /**
   * Plan every kept triangular face or return the failed visibility premise.
   *
   * @param vertices Existing indexed positions; no coordinate is changed.
   * @param constraints Original boundary primitives in their native cover.
   * @param keeps Interior membership of the desired residual source partition.
   * @param period Positive phase period, absent for a planar chart.
   * @param indexed Whether the consumer drops explicit lifts into a global index buffer; then half-period ties are unavailable.
   * @param occupied Immutable prior global endpoint-pair keys `minID/maxID`; new interior bridges/ears cannot reuse them. Existing source boundaries retain their identities and final global incidence belongs to the caller.
   * @param scale Phase scale of the uniform metric the bridges are chosen and the free diagonals legalized in, positive and finite, length units per radian; 1 reads the chart as given.
   * @param local The face's phase scale where a chart point lies, which legalization reads in place of `scale` (`legalizeAutoMovieSolidMesh`); absent, the free diagonals are legalized in `scale` too.
   * @returns Positive native-chart index triples with split-source provenance, or a named construction failure.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Subdivides shared constraints, uses explicit left probes and winding to identify hole/periodic boundary components, joins them visibly and validates the indexed ears against the residual source partition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The union result is atomic: failed coverage publishes no partial triangle population.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tests all represented vertices and existing segment images for each diagonal; kept nonzero-winding or nontriangular components are refused rather than silently dropped. Membership must remain unchanged during the synchronous call.
   * @evidence contracts/development/common.md#meaningful-documentation Names original-ID ownership, residual membership, periodic search scope and atomic failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each of H joins can scan W squared boundary-occurrence pairs with O(V+S+H) visibility work; ear removal is cubic, M interior insertions cost O(M(T+M)) and legalization at most V(V-1)/2 constant-cost flips. Splitting, bounded witness probes and Q times caller predicate cost are additional. Component count decreases after each bridge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ranks each join's candidate pairs once by metric length and stops at the first visible one; original indexed positions serve incidence, visibility and ear reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns new triangles and the owned split records/source-index histories, including total provenance length P; input maps/segments and membership reader remain borrowed for this call and are never stored globally.
   */
  export function triangulate(
    vertices: ReadonlyMap<number, Point>,
    constraints: readonly AutoMovieSolidMeshConstraints.ISegment[],
    keeps: (u: number, v: number) => boolean,
    period?: number,
    indexed: boolean = false,
    occupied?: ReadonlySet<string>,
    scale: number = 1,
    local?: (u: number, v: number) => number,
  ): IPlan | string {
    const split: AutoMovieSolidMeshConstraints.IEdge[] | string =
      AutoMovieSolidMeshConstraints.split(vertices, constraints, period);
    if (typeof split === "string") return split;
    const edges: AutoMovieSolidMeshConstraints.ISegment[] = [...split];
    const entries: [number, Point][] = [...vertices];
    if (entries.length === 0) return { triangles: [], constraints: split };
    let lower: number = Infinity;
    let upper: number = -Infinity;
    let bottom: number = Infinity;
    let top: number = -Infinity;
    for (const entry of entries) {
      lower = Math.min(lower, entry[1][0]);
      upper = Math.max(upper, entry[1][0]);
      bottom = Math.min(bottom, entry[1][1]);
      top = Math.max(top, entry[1][1]);
    }
    const width: number = upper - lower || 1;
    const height: number = period ?? (top - bottom || 1);
    if (!(Number.isFinite(width) && Number.isFinite(height)))
      return "visibility chart spans are not representable";
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
    const triangles: ITriangle[] = [];
    for (const component of boundaries) {
      const made: ITriangle[] | string = triangulateAutoMovieSolidBoundary(
        vertices,
        component.walk,
        period,
        indexed,
        occupied,
      );
      if (typeof made === "string") return made;
      for (const triangle of made) {
        const points: Point[] = triangle.vertices.map(
          (id: number, index: number): Point => [
            vertices.get(id)![0],
            vertices.get(id)![1] + triangle.lifts[index]! * (period ?? 0),
          ],
        );
        const probe: Point | string = centroid(points);
        if (typeof probe === "string")
          return `boundary ear: ${probe}; original vertices ${triangle.vertices.join("/")}; cover ${JSON.stringify(points)}`;
        if (!keeps(probe[0], probe[1]))
          return `native ear left the kept source partition; triangle ${JSON.stringify({ vertices: triangle.vertices, lifts: triangle.lifts, cover: points, probe })}`;
        triangles.push(triangle);
      }
    }
    const inserted: ITriangle[] | string = insertAutoMovieSolidMeshPoints(
      vertices,
      split,
      triangles,
      keeps,
      period,
      indexed,
    );
    if (typeof inserted === "string") return inserted;
    const legal: ITriangle[] | string = legalizeAutoMovieSolidMesh(
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
    for (const triangle of legal) {
      const points: Point[] = triangle.vertices.map(
        (id: number, index: number): Point => [
          vertices.get(id)![0],
          vertices.get(id)![1] + triangle.lifts[index]! * (period ?? 0),
        ],
      );
      const probe: Point | string = centroid(points);
      if (typeof probe === "string")
        return `inserted grid triangle: ${probe}; original vertices ${triangle.vertices.join("/")}; cover ${JSON.stringify(points)}`;
      if (!keeps(probe[0], probe[1]))
        return `inserted triangle left the kept source partition; triangle ${JSON.stringify({ vertices: triangle.vertices, lifts: triangle.lifts, cover: points, probe })}`;
    }
    return { triangles: legal, constraints: split };
  }
}

/** Kept left boundary components; exact ray parity distinguishes finite outer walks from holes. */
function components(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  keeps: (u: number, v: number) => boolean,
  period: number | undefined,
): Component[] | string {
  const walks: AutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(vertices, edges, period);
  if (typeof walks === "string") return walks;
  const result: Component[] = [];
  for (const walk of walks) {
    const points: Point[] = walk.vertices.map(
      (id: number, index: number): Point => [
        vertices.get(id)![0],
        vertices.get(id)![1] + walk.lifts[index]! * (period ?? 0),
      ],
    );
    if (!points.every((point: Point): boolean => point.every(Number.isFinite)))
      return "visibility face cover coordinates are not representable";
    if (
      walk.winding === 0 &&
      points.length === 3 &&
      new Set(walk.vertices).size === 3 &&
      orientAutoMovieSolidChart(points[0]!, points[1]!, points[2]!) > 0
    ) {
      const strict: Point | string = centroid(points);
      if (typeof strict === "string")
        return `arrangement face: ${strict}; original vertices ${walk.vertices.join("/")}; cover ${JSON.stringify(points)}`;
    }
    const probe: Point | string = probeAutoMovieSolidMesh(
      vertices,
      edges,
      walk,
      period,
    );
    if (typeof probe === "string") return probe;
    if (!keeps(probe[0], probe[1])) continue;
    let inside: boolean = false;
    if (walk.winding === 0)
      for (let k: number = 0; k < points.length; k++) {
        const a: Point = points[k]!;
        const b: Point = points[(k + 1) % points.length]!;
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
 * The shortest visible bridge from the selected component to any other, in
 * the face's uniform metric: `du^2 + (scale dv)^2`, the same metric the free
 * diagonals are legalized in (`legalizeAutoMovieSolidMesh`; George and
 * Borouchaki 1998), so a bridge joins its two boundaries where they stand
 * closest on the surface. On a periodic annulus (a station band between two
 * winding cycles) that is the pair at matching phase, a bridge straight
 * across the band. Original IDs and the turn only break exact length ties,
 * for a deterministic choice.
 *
 * Choosing by ID order instead (the earlier rule) let two cycles whose
 * smallest IDs stand half a period apart be bridged by a half-period
 * diagonal: the ears beside it then span more than half a period, which the
 * cover rule refuses, and the face was left untriangulated (a split band,
 * 2026-11-08).
 *
 * The search is exact without ranking every pair: first each selected
 * vertex's own shortest candidate, those few ranked by length (then IDs and
 * turn) and tested for visibility in that order; then every other candidate
 * strictly shorter than the first visible one found, ranked the same way,
 * since only such a candidate could still beat it. Each candidate keeps the
 * shortest phase image allowed (both at a half-period tie, as before).
 */
function bridge(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  boundaries: readonly Component[],
  selected: number,
  keeps: (u: number, v: number) => boolean,
  period: number | undefined,
  occupied: ReadonlySet<string> | undefined,
  scale: number,
): Candidate | string {
  type Ranked = { candidate: Candidate; length: number };
  /** Whether a pair already holds a prior global edge, which no bridge may reuse. */
  const taken: (a: number, b: number) => boolean = (
    a: number,
    b: number,
  ): boolean =>
    occupied?.has(`${Math.min(a, b)}/${Math.max(a, b)}`) === true;
  /**
   * Visit every candidate of a pair that may hold a bridge, with its squared
   * metric length; a string stops the visit. A taken pair is no candidate, but
   * the visitor asks `taken` itself, and only of a candidate it would keep:
   * the pairs are the product of two boundaries' vertices, and keying every
   * one of them cost more than the search. A pair whose image cannot be
   * represented is refused only when it is not taken, as before.
   */
  const each: (
    visit: (a: number, b: number, turn: number, length: number) => void,
  ) => string | null = (
    visit: (a: number, b: number, turn: number, length: number) => void,
  ): string | null => {
    const span: number = period ?? 0;
    for (const a of boundaries[selected]!.walk.vertices) {
      const first: Point = vertices.get(a)!;
      for (let j: number = 0; j < boundaries.length; j++) {
        if (j === selected) continue;
        for (const b of boundaries[j]!.walk.vertices) {
          if (a === b) continue;
          const last: Point = vertices.get(b)!;
          const nearest: number =
            period === undefined
              ? 0
              : Math.round((first[1] - last[1]) / period);
          if (!Number.isSafeInteger(nearest)) {
            if (taken(a, b)) continue;
            return "visibility bridge cover image is not representable";
          }
          for (
            let turn: number = period === undefined ? 0 : nearest - 1;
            turn <= (period === undefined ? 0 : nearest + 1);
            turn++
          ) {
            const phase: number = last[1] + turn * span;
            if (
              !Number.isSafeInteger(turn) ||
              !Number.isFinite(last[0]) ||
              !Number.isFinite(phase)
            ) {
              if (taken(a, b)) break;
              return "visibility bridge endpoint is not representable";
            }
            if (period !== undefined && Math.abs(phase - first[1]) > period / 2)
              continue;
            const length: number =
              (last[0] - first[0]) ** 2 + (scale * (phase - first[1])) ** 2;
            if (!Number.isFinite(length)) {
              if (taken(a, b)) break;
              return "visibility bridge length is not representable";
            }
            visit(a, b, turn, length);
          }
        }
      }
    }
    return null;
  };
  /** Whether a candidate comes strictly before a ranked one in the exact total order. */
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
      const first: Point = vertices.get(candidate.a)!;
      const last: Point = vertices.get(candidate.b)!;
      const end: Point = [last[0], last[1] + candidate.turn * (period ?? 0)];
      const visible: boolean | string = clear(
        vertices,
        edges,
        candidate,
        period,
      );
      if (typeof visible === "string") return visible;
      if (!visible) continue;
      const middle: Point = midpoint(first, end);
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

/** A strict represented centroid, never a silent empty-face classification at rounded boundaries. */
function centroid(points: readonly Point[]): Point | string {
  const point: Point = [
    points[0]![0] / 3 + points[1]![0] / 3 + points[2]![0] / 3,
    points[0]![1] / 3 + points[1]![1] / 3 + points[2]![1] / 3,
  ];
  return point.every(Number.isFinite) &&
    points.every(
      (corner: Point, index: number): boolean =>
        orientAutoMovieSolidChart(corner, points[(index + 1) % 3]!, point) > 0,
    )
    ? point
    : "visibility triangle has no represented strict centroid";
}

/** Identity of an unoriented edge, including its relative cover turn. */
function key(edge: AutoMovieSolidMeshConstraints.ISegment): string {
  return edge.a < edge.b || (edge.a === edge.b && edge.turn > 0)
    ? `${edge.a}/${edge.b}/${edge.turn}`
    : `${edge.b}/${edge.a}/${-edge.turn}`;
}

/** A finite midpoint without adding two potentially large coordinates. */
function midpoint(a: Point, b: Point): Point {
  return [
    a[0] === b[0] ? a[0] : a[0] / 2 + b[0] / 2,
    a[1] === b[1] ? a[1] : a[1] / 2 + b[1] / 2,
  ];
}

/** Neighbour images cover comparisons with shortest-image visibility edges and one-period primitives. */
function images(
  value: number,
  a: Point,
  b: Point,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: Point = midpoint(a, b);
  const nearest: number = Math.round((middle[1] - value) / period);
  return Number.isSafeInteger(nearest) &&
    Number.isSafeInteger(nearest - 1) &&
    Number.isSafeInteger(nearest + 1)
    ? [nearest - 1, nearest, nearest + 1]
    : null;
}

/** Exact closed segment membership on the represented native points. */
function on(a: Point, b: Point, p: Point): boolean {
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
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  candidate: AutoMovieSolidMeshConstraints.ISegment,
  period: number | undefined,
): boolean | string {
  const a: Point = vertices.get(candidate.a)!;
  const stored: Point = vertices.get(candidate.b)!;
  const b: Point = [stored[0], stored[1] + candidate.turn * (period ?? 0)];
  if (a[0] === b[0] && a[1] === b[1]) return false;
  for (const entry of vertices) {
    const [id, point]: [number, Point] = entry;
    const shifts: number[] | null = images(point[1], a, b, period);
    if (shifts === null)
      return "visibility vertex cover image is not representable";
    for (const turn of shifts) {
      if (
        (id === candidate.a && turn === 0) ||
        (id === candidate.b && turn === candidate.turn)
      )
        continue;
      const lifted: Point = [point[0], point[1] + turn * (period ?? 0)];
      if (!lifted.every(Number.isFinite))
        return "visibility vertex cover coordinates are not representable";
      if (on(a, b, lifted)) return false;
    }
  }
  for (const edge of edges) {
    if (key(edge) === key(candidate)) return false;
    const first: Point = vertices.get(edge.a)!;
    const last: Point = vertices.get(edge.b)!;
    const shifts: number[] | null = images(first[1], a, b, period);
    if (shifts === null)
      return "visibility edge cover image is not representable";
    for (const turn of shifts) {
      const c: Point = [first[0], first[1] + turn * (period ?? 0)];
      const d: Point = [last[0], last[1] + (turn + edge.turn) * (period ?? 0)];
      if (![...c, ...d].every(Number.isFinite))
        return "visibility edge cover coordinates are not representable";
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
