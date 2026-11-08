import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** A point in one face's native station/phase chart. */
type Point = readonly [number, number];

/** One indexed point in the universal cover of a periodic chart. */
interface Cut {
  /** Original shared vertex identity. */
  id: number;

  /** Integer period added to that vertex's stored phase. */
  turn: number;

  /** Representable lifted coordinates for predicates and ordering only. */
  point: Point;
}

/**
 * Partition existing indexed chart constraints without inventing or welding a point.
 *
 * T junctions and collinear overlaps are split at the caller's existing vertices.
 * Every subconstraint retains all of its original segment indices. Proper
 * crossings require a supplied shared vertex: that vertex belongs to the
 * analytic boundary producer, not a later triangle reconstruction. Periodic
 * edges carry an explicit cover turn, so coincident endpoints on different
 * sheets do not erase winding.
 *
 * @evidence contracts/common.md#principled-implementation Splits each native-chart segment at existing exactly collinear vertices, deduplicates indexed subconstraints with their source histories and checks all remaining intersections. Exact sign predicates decide represented coordinates without snapping.
 * @evidence contracts/common.md#clear-and-simple-design One immutable partition operation separates constraint identity from later face selection and triangulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source point is interpolated, no distinct authoritative IDs are welded, and an unshared crossing remains a named failure. This is not a complete face mesher.
 * @evidence contracts/common.md#meaningful-documentation States existing-point authority, source-segment provenance, periodic turns and explicit unsupported/representability failures.
 * @evidence contracts/performance.md#efficient-algorithms For V points and E input segments, split preparation scans at most three images of each point per segment and sorts its cuts. S resulting subconstraints then undergo O(S squared) pair validation; input families with many overlaps can retain O(EV) source incidences.
 * @evidence contracts/performance.md#reuse-equivalent-work Each subconstraint is stored once by indexed endpoints and relative turn, with all overlapping source segments sharing that record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All maps/cuts are call-local; the caller owns the returned subconstraints and source-index arrays. No surface callback, mesh, vertex array or cache is retained.
 */
export namespace AutoMovieSolidMeshConstraints {
  /**
   * Whether an existing constraint contains this represented chart point.
   *
   * @evidence contracts/common.md#principled-implementation Tests exact collinearity and closed coordinate ranges in each admitted local cover image, sharing the same represented-point predicate as split.
   * @evidence contracts/common.md#clear-and-simple-design One membership reading lets grid/domain preparation avoid creating a new index on an authoritative shared boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns no closest point or welded identity; a nearby distinct coordinate remains distinct and unavailable/overflowing inputs fail by name.
   * @evidence contracts/common.md#meaningful-documentation States closed-segment meaning, single-period primitive premise and absence of source-point construction.
   * @evidence contracts/performance.md#efficient-algorithms Scans S supplied segments and at most three point images each in O(S) work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure query retains no geometry or callback; caller-local source preparation owns repeated-query reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Uses fixed per-segment scratch and returns a boolean/string without retaining inputs.
   */
  export function contains(vertices: ReadonlyMap<number, Point>, segments: readonly ISegment[], point: Point, period?: number): boolean | string {
    if (point.length !== 2 || !point.every(Number.isFinite) || (period !== undefined && !(Number.isFinite(period) && period > 0))) return "constraint membership needs finite coordinates and a positive period";
    for (const segment of segments) {
      const a: Point | undefined = vertices.get(segment.a);
      const stored: Point | undefined = vertices.get(segment.b);
      if (a === undefined || stored === undefined || !Number.isSafeInteger(segment.turn) || (period === undefined && segment.turn !== 0)) return "constraint membership has an unavailable endpoint or invalid turn";
      const b: Point = [stored[0], stored[1] + segment.turn * (period ?? 0)];
      if (![...a, ...b].every(Number.isFinite)) return "constraint membership cover is not representable";
      const shifts: number[] | null = images(point[1], a[1], b[1], period);
      if (shifts === null) return "constraint membership image is not representable";
      for (const lift of shifts) {
        const lifted: Point = [point[0], point[1] + lift * (period ?? 0)];
        if (!lifted.every(Number.isFinite)) return "constraint membership point is not representable";
        if (on(a, b, lifted)) return true;
      }
    }
    return false;
  }

  /**
   * An existing straight native-chart segment and its periodic lift.
   *
   * @evidence contracts/common.md#principled-implementation Endpoint IDs name original evaluated vertices; turn selects the second endpoint's sheet without changing its identity.
   * @evidence contracts/common.md#clear-and-simple-design Two IDs and one integer expose the complete indexed segment.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no inferred world point, normal or positional weld.
   * @evidence contracts/common.md#meaningful-documentation Members state endpoint authority and the cover-turn convention.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input record has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Partition owns overlap reuse; the record schedules no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns these scalars and their vertex map.
   */
  export interface ISegment {
    /** Original first endpoint ID. */
    a: number;

    /** Original second endpoint ID. */
    b: number;

    /** Integer periods added to b's stored phase; zero in a nonperiodic chart. */
    turn: number;
  }

  /**
   * One subconstraint with every inducing input segment preserved.
   *
   * @evidence contracts/common.md#principled-implementation The indexed subsegment and its source list preserve the input-to-refinement relation across overlaps and T junctions.
   * @evidence contracts/common.md#clear-and-simple-design Extends the same segment record with one explicit provenance array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate geometry does not discard an inducing segment or replace a vertex identity.
   * @evidence contracts/common.md#meaningful-documentation Sources index the original segment population, independently of output ordering.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work split owns the shared record construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record owns its source-index array and retains no caller object.
   */
  export interface IEdge extends ISegment {
    /** Original input segment indices that contain this subconstraint. */
    sources: number[];
  }

  /**
   * Split already evaluated constraints; return their named premise failure unchanged.
   * Each primitive spans at most one period. Callers segment longer source paths
   * before this operation, as the existing sampled trim/grid producers do.
   *
   * @evidence contracts/common.md#principled-implementation Existing vertices on each lifted closed segment become sorted cuts. Indexed/turn identity deduplicates overlapping pieces, followed by exact-sign contact validation.
   * @evidence contracts/common.md#clear-and-simple-design One result union exposes a complete partition or the first explicit failure, without mutating caller data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Distinct coincident IDs and proper crossings without an original vertex are refused rather than silently merged or reconstructed. The one-period primitive premise limits cover-image work.
   * @evidence contracts/common.md#meaningful-documentation States lift range, source indices, immutability, failure and absence of world geometry construction.
   * @evidence contracts/performance.md#efficient-algorithms O(EV log V plus S squared) work for E segments, V points and S unique pieces, with at most three periodic point/edge images per local comparison.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses each source vertex value and one indexed piece record for all of its inducing segments; no callback effects are shared.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps and cut arrays expire with the call; output source incidence storage can grow to O(EV), with no retained global state.
   */
  export function split(
    vertices: ReadonlyMap<number, Point>,
    segments: readonly ISegment[],
    period?: number,
  ): IEdge[] | string {
    if (period !== undefined && !(Number.isFinite(period) && period > 0))
      return "constraint period must be finite and positive";
    for (const entry of vertices) {
      const [id, point]: [number, Point] = entry;
      if (
        !Number.isSafeInteger(id) ||
        id < 0 ||
        point.length !== 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1])
      )
        return `constraint vertex ${id} needs an original nonnegative ID and finite chart coordinates`;
    }
    const pieces: Map<string, IEdge> = new Map();
    for (let source: number = 0; source < segments.length; source++) {
      const segment: ISegment = segments[source]!;
      const a: Point | undefined = vertices.get(segment.a);
      const stored: Point | undefined = vertices.get(segment.b);
      if (
        a === undefined ||
        stored === undefined ||
        !Number.isSafeInteger(segment.turn) ||
        (period === undefined && segment.turn !== 0)
      )
        return `constraint ${source} has an unavailable endpoint or invalid turn`;
      const b: Point = [stored[0], stored[1] + segment.turn * (period ?? 0)];
      if (!b.every(Number.isFinite) || (a[0] === b[0] && a[1] === b[1]))
        return `constraint ${source} has no finite nonzero lifted span`;
      if (period !== undefined) {
        const magnitude: number = Math.max(
          Math.abs(a[1]),
          Math.abs(b[1]),
          period,
        );
        // This reserve admits roundoff in the image-count bound only; it
        // never changes a coordinate or classifies a contact.
        if (
          Math.abs(b[1] / magnitude - a[1] / magnitude) >
          (period / magnitude) * (1 + 16 * Number.EPSILON)
        )
          return `constraint ${source} must be supplied as single-period primitives`;
      }
      const cuts: Cut[] = [
        { id: segment.a, turn: 0, point: a },
        { id: segment.b, turn: segment.turn, point: b },
      ];
      for (const entry of vertices) {
        const [id, point]: [number, Point] = entry;
        const shifts: number[] | null = images(point[1], a[1], b[1], period);
        if (shifts === null)
          return `constraint ${source} has an unrepresentable cover image`;
        for (const turn of shifts) {
          const lifted: Point = [point[0], point[1] + turn * (period ?? 0)];
          if (!lifted.every(Number.isFinite))
            return `constraint ${source} has a nonfinite cover coordinate`;
          if (on(a, b, lifted)) cuts.push({ id, turn, point: lifted });
        }
      }
      const axis: 0 | 1 =
        Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? 0 : 1;
      const direction: number = b[axis] > a[axis] ? 1 : -1;
      cuts.sort(
        (x: Cut, y: Cut): number =>
          direction *
          (x.point[axis] < y.point[axis]
            ? -1
            : x.point[axis] > y.point[axis]
              ? 1
              : 0),
      );
      const ordered: Cut[] = [];
      for (const cut of cuts) {
        const previous: Cut | undefined = ordered[ordered.length - 1];
        if (
          previous !== undefined &&
          previous.point[0] === cut.point[0] &&
          previous.point[1] === cut.point[1]
        ) {
          if (previous.id !== cut.id || previous.turn !== cut.turn)
            return `constraint ${source} has coincident authoritative vertices ${previous.id} and ${cut.id}`;
        } else ordered.push(cut);
      }
      for (let k: number = 1; k < ordered.length; k++) {
        const from: Cut = ordered[k - 1]!;
        const to: Cut = ordered[k]!;
        const forward: boolean =
          from.id < to.id || (from.id === to.id && to.turn > from.turn);
        const edge: ISegment = forward
          ? { a: from.id, b: to.id, turn: to.turn - from.turn }
          : { a: to.id, b: from.id, turn: from.turn - to.turn };
        const key: string = `${edge.a}/${edge.b}/${edge.turn}`;
        const known: IEdge | undefined = pieces.get(key);
        if (known === undefined)
          pieces.set(key, { ...edge, sources: [source] });
        else if (known.sources[known.sources.length - 1] !== source)
          known.sources.push(source);
      }
    }
    const edges: IEdge[] = [...pieces.values()];
    for (let i: number = 0; i < edges.length; i++)
      for (let j: number = i + 1; j < edges.length; j++) {
        const edge: IEdge = edges[i]!;
        const other: IEdge = edges[j]!;
        const a: Point = vertices.get(edge.a)!;
        const endpoint: Point = vertices.get(edge.b)!;
        const b: Point = [endpoint[0], endpoint[1] + edge.turn * (period ?? 0)];
        const origin: Point = vertices.get(other.a)!;
        const shifts: number[] | null = images(origin[1], a[1], b[1], period);
        if (shifts === null)
          return "subconstraint cover image is not representable";
        for (const turn of shifts) {
          const target: Point = vertices.get(other.b)!;
          const c: Point = [origin[0], origin[1] + turn * (period ?? 0)];
          const d: Point = [
            target[0],
            target[1] + (turn + other.turn) * (period ?? 0),
          ];
          if (![...c, ...d].every(Number.isFinite))
            return "subconstraint cover coordinates are not finite";
          const crosses: boolean =
            orientAutoMovieSolidChart(a, b, c) *
              orientAutoMovieSolidChart(a, b, d) <
              0 &&
            orientAutoMovieSolidChart(c, d, a) *
              orientAutoMovieSolidChart(c, d, b) <
              0;
          if (crosses)
            return `subconstraints ${i} and ${j} cross without a supplied shared vertex`;
        }
      }
    return edges;
  }
}

/** Exact represented-point membership on a closed straight segment; no identity is inferred from it. */
function on(a: Point, b: Point, point: Point): boolean {
  return (
    point[0] >= Math.min(a[0], b[0]) &&
    point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) &&
    point[1] <= Math.max(a[1], b[1]) &&
    orientAutoMovieSolidChart(a, b, point) === 0
  );
}

/** Three neighbouring images cover a primitive of at most one period; the midpoint calculation avoids overflow. */
function images(
  value: number,
  first: number,
  last: number,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: number = first === last ? first : first / 2 + last / 2;
  const turn: number = Math.round((middle - value) / period);
  return Number.isSafeInteger(turn) &&
    Number.isSafeInteger(turn - 1) &&
    Number.isSafeInteger(turn + 1)
    ? [turn - 1, turn, turn + 1]
    : null;
}
