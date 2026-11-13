/**
 * A trim cycle of a face in its own chart: the closed boundary of the face's
 * kept region, a sequence of shared vertices with their charts on this face
 * and, per segment, the neighbour face across it with the segment's ends in
 * the neighbour's chart.
 *
 * Kinds, as `AutoMovieSolidMesh.ILoop`: a `hole` encloses a region of
 * the chart and the face keeps its outside; an `island` keeps its inside.
 * A `start` or `end` cycle winds once round the face's periodic phase and
 * the face keeps the stations above
 * or below it. Membership is read in the chart: the crossing number of the
 * cycle's polygon for a hole (its phases moved by whole periods to the
 * cycle's own), and ray-crossing parity for a winding cycle even when that
 * cycle turns back in phase; a winding cycle sampled from an exact curve
 * crosses each phase line on that curve between the vertices it samples. The separate station reader returns only its
 * first crossing and is not a general inverse of that predicate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four kinds and which side each keeps.
 * @evidence contracts/development/design.md#principled-representation Represents A trim cycle of a face in its own chart: the closed boundary of the face's kept region, a sequence of shared vertices with their charts on this face and, per segment, the neighbour face across it with the segment's ends in the neighbour's chart: companion namespace of 12 members (`ICycle`, `INeighbour`, `IFoot`, `kept`, `prepare`, `IPrepared`, ...); units and frames named in its text: second, world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidCycle` in packages/engine/src/geometry/construction/AutoMovieSolidCycle.ts; its surface is the 12 members listed and the text shows 17 other files naming it, mostly packages/engine (14), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidCycle {
  /**
   * One mutable face boundary, with coindexed chart/mesh vertices and one
   * neighbour mapping per closing polygon segment.
   *
   * @evidence contracts/development/design.md#principled-representation Parallel vertex/chart/segment arrays represent a face's boundary and its shared neighbour correspondence without deriving geometry from a rendered mesh.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields separate kept-side kind, shared mesh identity, this chart and the adjacent chart's endpoint maps; the optional fifth carries the exact curve a winding cycle samples, absent where its chords are its boundary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not validate array lengths, winding, simplicity or inclusive boundary classification; prepared readers require unchanged kind/chart data during their lifetime.
   * @evidence contracts/development/common.md#meaningful-documentation States coindexing, closing-segment ownership, chart phase unwrapping and which face keeps each side.
   */
  export interface ICycle {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Mesh vertex indices, in cycle order. */
    vertices: number[];

    /** Each vertex's chart point `[u, v]` on this face, `v` unwrapped along the cycle. */
    chart: [number, number][];

    /** Per segment `k` (vertex `k` to `k + 1`, the last closing the cycle): the neighbour face across it. */
    neighbours: INeighbour[];

    /**
     * For a winding cycle sampled from an exact curve `u = along(v)` of this chart: the curve's station at a phase. A segment whose two
     * stored vertices both lie on it (`along(v) === u` at each, as the builder evaluated them) is read along the curve between them, not
     * as the chord through them; a vertex inserted later off the curve leaves its segments read as chords. Absent, every segment is a chord.
     */
    along?: (v: number) => number;
  }

  /**
   * The face across one segment and the same directed endpoints in its chart.
   * A body face index of -1 marks an open boundary; Body.atlas translates
   * included body indices to its own face indices before returning across.
   *
   * @evidence contracts/development/design.md#principled-representation An adjacent face identity and two corresponding chart endpoints let Body.atlas linearly map a boundary foot's segment share into that face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One fixed record keeps neighbour identity and directed endpoint correspondence together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A negative or excluded neighbour is not replaced by another face; the record alone does not prove that both surfaces meet along the segment.
   * @evidence contracts/development/common.md#meaningful-documentation Gives body-index ownership, the open sentinel and endpoint order before atlas-index translation.
   */
  export interface INeighbour {
    /** Neighbour index in the owning body, or -1 for an open boundary. */
    face: number;

    /** The segment's first vertex in the neighbour's chart. */
    from: [number, number];

    /** The segment's second vertex in the neighbour's chart. */
    to: [number, number];
  }

  /**
   * A nearest polygon-segment foot in Euclidean chart coordinates, not in
   * the surface metric or world millimetres when the parameters differ.
   *
   * @evidence contracts/development/design.md#principled-representation A segment index and clamped affine share identify the chart foot consumed by Clip and Body.atlas's neighbour map.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three scalars distinguish where the foot lies from the chart distance used to rank it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record certifies no analytic-curve or world-distance minimum; foot on an empty chart returns segment/share zero with infinite distance, not an admitted correspondence.
   * @evidence contracts/development/common.md#meaningful-documentation States polygon meaning, share range, distance space and the empty-chart sentinel limitation.
   */
  export interface IFoot {
    /** The segment, `k` to `k + 1`. */
    segment: number;

    /** The share along it, `[0, 1]`. */
    share: number;

    /** The chart distance to it, the point's phase moved by whole periods to the segment's. */
    distance: number;
  }

  /**
   * Whether a chart point lies on a cycle's kept side or on the cycle.
   *
   * @param cycle The cycle.
   * @param u The point's `u`.
   * @param v The point's `v`.
   * @param period The face's phase period; absent for a face that is not periodic.
   * @returns True on the kept side.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses crossing parity in the existing chart branches for all four cycle kinds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to the same predicate as the prepared reader, without retained state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original inequality and half-period tie; a winding segment on its cycle's exact curve (`ICycle.along`) reads that curve's station instead of the chord's, and no other boundary is moved.
   * @evidence contracts/development/common.md#meaningful-documentation The inclusive 'on cycle' wording has an existing strict-parity boundary gap, recorded separately; preparation does not claim to fix it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans S edges, plus the hole/island centre scan, in O(S) time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This live reading caches nothing; prepare is the face-local repeated-query path.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and retains no input or scratch after the call.
   */
  export function kept(
    cycle: Pick<ICycle, "kind" | "chart" | "along">,
    u: number,
    v: number,
    period: number | undefined,
  ): boolean {
    return read(cycle, u, v, period);
  }

  /**
   * Repeated kept-side readings while kind, chart and period remain unchanged.
   * Polygon boundary ties are exactly kept's existing strict comparisons;
   * this does not establish the documented inclusive-boundary contract.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses only cycle-invariant centre/endpoints; the shared reader retains the existing parity comparisons.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation and one shared predicate serve repeated chart queries without a spatial index.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the period fallback, Math.round ties and strict crossing tests; the existing exact-boundary contract gap is not repaired here.
   * @evidence contracts/development/common.md#meaningful-documentation States the unchanged-input lifetime and the existing boundary-tie limitation.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) preparation and O(S) per query for S edges; cached endpoints avoid per-query tuple allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller keeps cycle kind/chart and period unchanged while using the reader; a new face creates a new reader after edits or rollback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure owns O(S) endpoint scratch, with no global cache; dropping the reader releases those references.
   */
  export function prepare(
    cycle: Pick<ICycle, "kind" | "chart" | "along">,
    period: number | undefined,
  ): (u: number, v: number) => boolean {
    const curve: ((v: number) => number) | undefined = cycle.along;
    const prepared: IPrepared =
      cycle.kind === "hole" || cycle.kind === "island"
        ? { span: span(cycle) }
        : {
            ends: cycle.chart.map(
              (a: [number, number], k: number): [number, number, number] => {
                const raw: [number, number] =
                  cycle.chart[(k + 1) % cycle.chart.length]!;
                return windingEnd(a, raw, period ?? 2 * Math.PI);
              },
            ),
            ...(curve === undefined
              ? {}
              : {
                  on: cycle.chart.map((a: [number, number], k: number): boolean =>
                    on(curve, a, cycle.chart[(k + 1) % cycle.chart.length]!),
                  ),
                }),
          };
    return (u: number, v: number): boolean =>
      read(cycle, u, v, period, prepared);
  }

  /** Cycle-invariant values; coordinates and kind are owned unchanged by the caller. */
  interface IPrepared {
    /** Lowest and highest unwrapped v of a hole or an island (`span`). */ span?: [number, number];
    /** Original winding endpoint and its integer turn relative to the segment start. */ ends?: [
      number,
      number,
      number,
    ][];
    /** Per winding segment, whether both its vertices lie on the cycle's exact curve (`ICycle.along`). */ on?: boolean[];
  }

  /** Whether a segment's two stored vertices lie on the exact curve, as its builder evaluated them. */
  function on(
    curve: (v: number) => number,
    a: readonly [number, number],
    b: readonly [number, number],
  ): boolean {
    return curve(a[1]) === a[0] && curve(b[1]) === b[0];
  }

  /** Preserve the original raw endpoint's x/y-before-start-phase access and exception order. */
  function windingEnd(
    a: [number, number],
    raw: [number, number],
    period: number,
  ): [number, number, number] {
    const u: number = raw[0];
    const v: number = raw[1];
    return [u, v, Math.round((a[1] - v) / period)];
  }

  /**
   * The lowest and highest phase of a hole or an island along its own unwrapped chart; `[Infinity, -Infinity]` on an empty chart.
   *
   * A hole or an island does not wind round the period, so on the face it bounds one disc, and that disc's images in the unwrapped chart, one
   * per whole period, do not overlap: a point of the face lies inside the cycle when one of its own images lies inside the cycle's polygon.
   * Only an image within the span can. A cycle narrower than half a period on either side of its middle has one such image, the one nearest
   * the middle; a band cut through from rim to rim leaves an island almost a whole period wide, and a cut whose two runs across the band stand
   * apart in phase leaves one wider than a period, where a point near either end has two images within the span and only one of them lies
   * inside (f1's ear: an island 6.6 rad wide about 5.6, a triangle at 8.9 read at its image 2.6 and found outside).
   */
  function span(cycle: Pick<ICycle, "chart">): [number, number] {
    let low: number = Infinity;
    let high: number = -Infinity;
    // Each point's coordinates are read once, `u` then `v`, as `centre` reads them.
    for (const p of cycle.chart) {
      void p[0];
      const v: number = p[1];
      low = Math.min(low, v);
      high = Math.max(high, v);
    }
    return [low, high];
  }

  /** Crossing parity of the ray from `(u, w)` toward lower `u` against a hole's or an island's polygon, `w` already on the polygon's branch. */
  function crossed(cycle: Pick<ICycle, "chart">, u: number, w: number): boolean {
    const n: number = cycle.chart.length;
    let inside: boolean = false;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const b: [number, number] = cycle.chart[(k + 1) % n]!;
      if (
        a[1] > w !== b[1] > w &&
        u < a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
      )
        inside = !inside;
    }
    return inside;
  }

  /** The original parity and tie arithmetic, with optional invariant values. */
  function read(
    cycle: Pick<ICycle, "kind" | "chart" | "along">,
    u: number,
    v: number,
    period: number | undefined,
    prepared?: IPrepared,
  ): boolean {
    const n: number = cycle.chart.length;
    if (cycle.kind === "hole" || cycle.kind === "island") {
      // The image nearest the span's middle first, then any other image of the point within the span (`span`).
      const [low, high]: [number, number] =
        prepared === undefined ? span(cycle) : prepared.span!;
      const w: number = shift(v, (low + high) / 2, period);
      let inside: boolean = crossed(cycle, u, w);
      if (period !== undefined && period > 0)
        for (
          let k: number = 1;
          !inside && (w - k * period >= low || w + k * period <= high);
          k++
        )
          inside =
            (w - k * period >= low && crossed(cycle, u, w - k * period)) ||
            (w + k * period <= high && crossed(cycle, u, w + k * period));
      return cycle.kind === "island" ? inside : !inside;
    }

    // A winding cycle: the parity of its crossings with the ray from the
    // point along the phase line toward the side the face keeps it from
    // (down the stations for a start cycle). Move each original segment to
    // the query's cover: shifting the query instead can round a negative
    // sub-ULP phase to the closing endpoint and lose both adjacent crossings.
    const p: number = period ?? 2 * Math.PI;
    let count: number = 0;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const raw: [number, number] = cycle.chart[(k + 1) % n]!;
      const b: [number, number, number] =
        prepared === undefined ? windingEnd(a, raw, p) : prepared.ends![k]!;
      const turn: number = b[2];
      const end: number = b[1] + turn * p;
      const reference: number = (a[1] + end) / 2;
      let translation: number = 0;
      let bv: number = end;
      let w: number = v;
      if (Number.isFinite(p) && p > 0) {
        const image: number = -Math.round((reference - v) / p);
        translation = image * p;
        bv = b[1] + (turn + image) * p;
      } else {
        // Preserve the legacy invalid-period result; this branch admits no new source.
        w = shift(v, reference, p);
      }
      const av: number = a[1] + translation;
      if (av > w === bv > w) continue;

      // The crossing's station: on the exact curve when the segment samples it, since a face beside this one may end on that curve
      // itself (a port's band ends on the part's curved rail), and the chord between two vertices then stands off it by its sagitta,
      // a strip that belonged to neither face (0.03 mm on f1's arm under its armpit band). Otherwise the chord, the source start
      // coordinates keeping the original reached getter sequence.
      const curve: ((v: number) => number) | undefined = cycle.along;
      const x: number =
        curve !== undefined && (prepared?.on?.[k] ?? on(curve, a, raw))
          ? curve(w - translation)
          : a[0] +
            ((w - (a[1] + translation)) * (b[0] - a[0])) /
              (bv - (a[1] + translation));
      if (cycle.kind === "start" ? x <= u : x >= u) count++;
    }
    return count % 2 === 1;
  }

  /**
   * The station a winding cycle crosses a phase at, by linear interpolation
   * in its chart.
   *
   * @param cycle A `start` or `end` cycle.
   * @param v The phase.
   * @param period The face's phase period.
   * @returns The station.
   *   Requires a nonempty winding chart and a finite positive period. The
   *   first crossing wins; if none is found, the first vertex's station is
   *   returned. Multiple crossings are not resolved into a unique station.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reduces the query into the winding direction inferred from the endpoint phase span, then linearly interpolates the first segment bracketing that phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single scan implements this first-crossing utility separately from kept's multi-crossing parity; no production caller currently requires it as an inverse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Leaves first-match and first-vertex fallback observable; a turnback cycle does not acquire a unique inverse and malformed empty input is not admitted here.
   * @evidence contracts/development/common.md#meaningful-documentation Gives period/nonempty premises, first-crossing behavior and the no-match fallback in chart-station units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans at most S segments with constant working storage, stopping at its first nonhorizontal crossing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure one-query scan coordinates no work; no station lookup table is retained between calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no cycle, query history or temporary closing-endpoint tuple.
   */
  export function station(
    cycle: Pick<ICycle, "chart">,
    v: number,
    period: number,
  ): number {
    const n: number = cycle.chart.length;
    const v0: number = cycle.chart[0]![1];
    const span: number = cycle.chart[n - 1]![1] - v0;
    const sense: number = span >= 0 ? 1 : -1;
    const local: number = v0 + sense * reduce(sense * (v - v0), period);
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const b: [number, number] =
        k + 1 < n
          ? cycle.chart[k + 1]!
          : [cycle.chart[0]![0], cycle.chart[0]![1] + sense * period];
      if ((local - a[1]) * (local - b[1]) <= 0 && a[1] !== b[1])
        return a[0] + ((local - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
    }
    return cycle.chart[0]![0];
  }

  /**
   * A point's nearest segment of a cycle in the chart.
   *
   * @param cycle The cycle.
   * @param u The point's `u`.
   * @param v The point's `v`.
   * @param period The face's phase period; absent for a face that is not periodic.
   * @returns The foot.
   *   Finite representable chart arithmetic is required for a meaningful
   *   nearest foot. Equal distances keep the earlier segment; a degenerate
   *   segment uses share zero, and an empty chart leaves distance infinite.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Projects onto each polygon segment by a clamped dot-product share in chart space, respecting the implemented closing-edge/query phase branches, and keeps the strict smallest distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One candidate record contains segment/share/distance, directly supporting Clip's split and Body.atlas's neighbour interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses chart distance without claiming a surface-metric or analytic-curve minimum; zero-length segments and the empty-chart sentinel preserve their explicit existing behavior.
   * @evidence contracts/development/common.md#meaningful-documentation States finite-arithmetic premises, periodic branch handling, tie order and degenerate/empty output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Compares all S segment projections to find the polygon's chart minimum without a spatial index; live candidate storage is constant, with a new small record on each improved minimum.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One independent nearest-foot scan coordinates no shared work; repeated callers rescan the polygon.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only the final three-scalar foot; earlier candidates and per-edge tuples are call-local and no cycle reference is retained afterward.
   */
  export function foot(
    cycle: Pick<ICycle, "chart">,
    u: number,
    v: number,
    period: number | undefined,
  ): IFoot {
    const n: number = cycle.chart.length;
    let best: IFoot = { segment: 0, share: 0, distance: Infinity };
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const b: [number, number] = cycle.chart[(k + 1) % n]!;
      const bv: number = k + 1 < n ? b[1] : shift(b[1], a[1], period);
      const w: number = shift(v, a[1], period);
      const dx: number = b[0] - a[0];
      const dy: number = bv - a[1];
      const dd: number = dx * dx + dy * dy;
      const s: number =
        dd > 0
          ? Math.min(1, Math.max(0, ((u - a[0]) * dx + (w - a[1]) * dy) / dd))
          : 0;
      const d: number = Math.hypot(u - a[0] - s * dx, w - a[1] - s * dy);
      if (d < best.distance) best = { segment: k, share: s, distance: d };
    }
    return best;
  }

  /**
   * The arithmetic mean of the cycle's stored chart points, with no phase
   * reduction. Empty charts yield two NaNs; this is not an area centroid.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A coordinatewise mean supplies the periodic reference branch for hole/island parity, using the chart's already unwrapped vertex phases.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan and two accumulators produce the only centre needed by the cycle reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer an interior point, polygon-area centroid or alternate phase branch; empty/overflowing arithmetic remains observable.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes stored-coordinate mean, geometric centroid and empty-chart NaNs.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) additions and one two-entry result; no polygon triangulation or pairwise work is performed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Live kept calls recompute this mean, while prepare retains the same value only for unchanged cycle kind/chart/period dependencies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh two-number tuple and retains neither the chart nor any prior centre globally.
   */
  export function centre(cycle: Pick<ICycle, "chart">): [number, number] {
    let u: number = 0;
    let v: number = 0;
    for (const p of cycle.chart) {
      u += p[0];
      v += p[1];
    }
    return [u / cycle.chart.length, v / cycle.chart.length];
  }

  /**
   * A phase moved by whole periods nearest a reference.
   *
   * @param v The phase.
   * @param reference The phase to come near.
   * @param period The period; absent, no move.
   * @returns The moved phase.
   *   A defined period must be finite and positive for the nearest-period
   *   interpretation; Math.round retains its existing half-period tie rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Adds period times the rounded displacement to select a phase representative nearest reference under finite representable arithmetic and a positive period.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar formula shares the same branch convention across parity, chart feet and mesh metric distances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent period is identity; defined invalid periods/nonfinite arithmetic are not repaired, and Math.round ties are not replaced by modulo normalization.
   * @evidence contracts/development/common.md#meaningful-documentation States nearest-reference semantics, positive finite-period premise, identity omission and the preserved tie rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic without a loop over possible turns.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scalar branch calculation coordinates no requests or effects.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and owns no retained state, handle or task.
   */
  export function shift(
    v: number,
    reference: number,
    period: number | undefined,
  ): number {
    return period === undefined
      ? v
      : v + period * Math.round((reference - v) / period);
  }
}

/** A value reduced to `[0, period)`. */
function reduce(x: number, period: number): number {
  const r: number = x % period;
  return r < 0 ? r + period : r;
}
