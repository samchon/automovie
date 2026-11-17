import type { IAutoMovieSolidCycle } from "@automovie/interface";

/**
 * A trim cycle of a face in its own chart: the closed boundary of the face's
 * kept region, a sequence of shared vertices with their charts on this face
 * and, per segment, the neighbour face across it with the segment's ends in
 * the neighbour's chart.
 *
 * Kinds, as `IAutoMovieSolidMesh.ILoop`: a `hole` encloses a region of
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
 * @evidence contracts/development/design.md#principled-representation Represents A trim cycle of a face in its own chart: the closed boundary of the face's kept region, a sequence of shared vertices with their charts on this face and, per segment, the neighbour face across it with the segment's ends in the neighbour's chart: companion namespace of 15 exported members (`IAutoMovieSolidCycle.ICycle`, `IAutoMovieSolidCycle.IExactSegment`, `IAutoMovieSolidCycle.IExact`, `piece`, `divide`, `held`, ...); units and frames named in its text: second, world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidCycle` in packages/engine/src/geometry/construction/AutoMovieSolidCycle.ts; its surface is the 15 members listed and the text shows 17 other files naming it, mostly packages/engine (14), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidCycle {
  /**
   * The exact boundary one segment of a cycle lies on: the cycle's own for every segment of a cycle as built, the segment's record
   * on a cycle a clip has edited.
   *
   * @param cycle The cycle.
   * @param k The segment, vertex `k` to `k + 1`.
   * @param reversed Whether the caller walks the segment from `k + 1` to `k`, as a clip does that joins two trims.
   * @returns The owner's readers with the removed side of the directed chord, or null where the segment is a chord.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exactness belongs to a segment between two consecutive vertices of one owner's curve; an edited cycle records it per segment, and a cycle as built is such a segment throughout.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader serves the kept test, the crossing map and the clip's rebuilds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cycle with a foreign vertex count and no per-segment record reads no curve; nothing is inferred from positions.
   * @evidence contracts/development/common.md#meaningful-documentation States both sources of the record and the reversed walk.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time on an edited cycle; O(S) for the orientation of a cycle as built.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reader coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the cycle's record or a fresh one sharing the owner's readers; retains nothing.
   */
  export function piece(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart" | "exact" | "segments">,
    k: number,
    reversed: boolean = false,
  ): IAutoMovieSolidCycle.IExactSegment | null {
    const found: IAutoMovieSolidCycle.IExactSegment | null =
      cycle.segments !== undefined
        ? (cycle.segments[k] ?? null)
        : cycle.exact !== undefined && cycle.exact.count === cycle.chart.length
          ? { exact: cycle.exact, sense: removed(cycle) }
          : null;
    return found === null || !reversed
      ? found
      : { exact: found.exact, sense: -found.sense };
  }

  /**
   * Record that a clip places a vertex into a segment, before the caller splices the vertex in: the segment becomes two chords, and
   * every other segment keeps the boundary it lies on.
   *
   * @param cycle The cycle; its `segments` are written.
   * @param segment The segment the vertex is placed into.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A crossing is placed by a bisection of the clip's own rail, so the two pieces beside it run to a point the owner's curve does not own; the segments beyond them still join the owner's consecutive vertices.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The one place a cycle as built turns into an edited one.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves no vertex and drops no reader of an untouched segment.
   * @evidence contracts/development/common.md#meaningful-documentation States the call order and what changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) once per cycle for its orientation, then one splice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every segment of one owner shares one record.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cycle holds one array of S references.
   */
  export function divide(cycle: IAutoMovieSolidCycle.ICycle, segment: number): void {
    if (cycle.segments === undefined) {
      const whole: IAutoMovieSolidCycle.IExactSegment | null = piece(cycle, segment);
      if (whole === null) return;
      cycle.segments = cycle.chart.map((): IAutoMovieSolidCycle.IExactSegment => whole);
    }
    cycle.segments.splice(segment, 1, null, null);
  }

  /**
   * Whether a chart point lies on a cycle's kept side, each segment read as what it is: the owner's curve where the segment lies on
   * an exact boundary (`piece`), its chord elsewhere (`kept`).
   *
   * A cycle as built reads its owner's curve alone. On an edited cycle the chords give the reading, and it is reversed for a point
   * between an exact segment's chord and its curve: the cycle's true boundary is the chords with each exact segment's chord replaced
   * by its arc, and crossing parity adds over those replacements, so the reading changes exactly inside the lens between chord and
   * arc. The lens a point can lie in is that of the segment at its foot; the point is in it when the owner's curve and that chord
   * disagree about its side.
   *
   * @param cycle The cycle.
   * @param u The point's `u`.
   * @param v The point's `v`.
   * @param period The face's phase period; absent for a face that is not periodic.
   * @returns True on the kept side or on the boundary.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The atlas's region is the owner's curve between an owner's consecutive vertices, the same curve the neighbouring face ends on, and a clip's chords elsewhere; the parity of crossings is additive over the chord-to-arc replacements.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The cycle as built keeps its one reader; an edited one adds one foot and one side test to the chords' reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no tolerance; a point whose foot is a chord reads exactly as `kept`. The lens is attributed by the nearest segment, so a point nearer another segment than the exact one whose lens it lies in reads its chords.
   * @evidence contracts/development/common.md#meaningful-documentation States both readings and the lens rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owner's reader alone on a cycle as built; on an edited one `kept` and `foot`, O(S) each, and the owner's reader.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reader coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean; retains nothing.
   */
  export function held(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart" | "along" | "exact" | "segments">,
    u: number,
    v: number,
    period: number | undefined,
  ): boolean {
    if (cycle.segments === undefined) {
      const whole: IAutoMovieSolidCycle.IExact | undefined =
        cycle.exact?.count === cycle.chart.length ? cycle.exact : undefined;
      return whole?.kept !== undefined
        ? whole.kept(u, v)
        : kept(cycle, u, v, period);
    }
    const chords: boolean = kept(cycle, u, v, period);
    const at: IAutoMovieSolidCycle.IFoot = foot(cycle, u, v, period);
    const beside: IAutoMovieSolidCycle.IExactSegment | null = cycle.segments[at.segment] ?? null;
    if (beside === null || beside.exact.kept === undefined) return chords;

    // The point's side of the chord at its foot against its side of the owner's curve.
    const a: [number, number] = cycle.chart[at.segment]!;
    const b: [number, number] = cycle.chart[(at.segment + 1) % cycle.chart.length]!;
    const w: number = shift(v, a[1], period);
    const side: number =
      beside.sense *
      ((b[0] - a[0]) * (w - a[1]) - (shift(b[1], a[1], period) - a[1]) * (u - a[0]));
    return side > 0 === beside.exact.kept(u, v) ? !chords : chords;
  }

  /**
   * A deep copy of a cycle, so later clips that edit cycles in place leave it as it was; its exact curve and boundary readers are pure
   * functions of the owner's curve, shared rather than copied.
   *
   * @param c The cycle.
   * @returns The copy.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies every array a clip edits in place and shares the immutable readers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The one copy every snapshot of a body uses, so none drops a reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no value.
   * @evidence contracts/development/common.md#meaningful-documentation States what is copied and what is shared.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) for S vertices.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure copy coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record; retains nothing.
   */
  export function copy(c: IAutoMovieSolidCycle.ICycle): IAutoMovieSolidCycle.ICycle {
    return {
      kind: c.kind,
      vertices: c.vertices.slice(),
      chart: c.chart.map((p: [number, number]): [number, number] => [p[0], p[1]]),
      neighbours: c.neighbours.map(
        (n: IAutoMovieSolidCycle.INeighbour): IAutoMovieSolidCycle.INeighbour => ({
          face: n.face,
          from: [n.from[0], n.from[1]],
          to: [n.to[0], n.to[1]],
        }),
      ),
      ...(c.along === undefined ? {} : { along: c.along }),
      ...(c.exact === undefined ? {} : { exact: c.exact }),
      ...(c.segments === undefined ? {} : { segments: c.segments.slice() }),
    };
  }

  /**
   * The removed side of a cycle's directed chords as its owner built it (`IAutoMovieSolidCycle.IExactSegment.sense`): a hole removes its polygon's inside,
   * the left of its chords when its signed chart area is positive, and an island the outside; a start cycle removes the stations
   * below it, the left of chords of rising phase, and an end cycle those above.
   */
  function removed(cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart">): number {
    const n: number = cycle.chart.length;
    if (cycle.kind === "start" || cycle.kind === "end")
      return (
        Math.sign(cycle.chart[n - 1]![1] - cycle.chart[0]![1]) *
        (cycle.kind === "start" ? 1 : -1)
      );
    let area: number = 0;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const b: [number, number] = cycle.chart[(k + 1) % n]!;
      area += a[0] * b[1] - b[0] * a[1];
    }
    return Math.sign(area) * (cycle.kind === "hole" ? 1 : -1);
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original inequality and half-period tie; a winding segment on its cycle's exact curve (`IAutoMovieSolidCycle.ICycle.along`) reads that curve's station instead of the chord's, and no other boundary is moved.
   * @evidence contracts/development/common.md#meaningful-documentation The inclusive 'on cycle' wording has an existing strict-parity boundary gap, recorded separately; preparation does not claim to fix it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans S edges, plus the hole/island centre scan, in O(S) time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This live reading caches nothing; prepare is the face-local repeated-query path.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and retains no input or scratch after the call.
   */
  export function kept(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart" | "along">,
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
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart" | "along">,
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
                  on: cycle.chart.map(
                    (a: [number, number], k: number): boolean =>
                      on(curve, a, cycle.chart[(k + 1) % cycle.chart.length]!),
                  ),
                }),
          };
    return (u: number, v: number): boolean =>
      read(cycle, u, v, period, prepared);
  }

  /** Cycle-invariant values; coordinates and kind are owned unchanged by the caller. */
  interface IPrepared {
    /** Lowest and highest unwrapped v of a hole or an island (`span`). */ span?: [
      number,
      number,
    ];
    /** Original winding endpoint and its integer turn relative to the segment start. */ ends?: [
      number,
      number,
      number,
    ][];
    /** Per winding segment, whether both its vertices lie on the cycle's exact curve (`IAutoMovieSolidCycle.ICycle.along`). */ on?: boolean[];
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
  function span(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "chart">,
  ): [number, number] {
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
  function crossed(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "chart">,
    u: number,
    w: number,
  ): boolean {
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
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "kind" | "chart" | "along">,
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
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "chart">,
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
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "chart">,
    u: number,
    v: number,
    period: number | undefined,
  ): IAutoMovieSolidCycle.IFoot {
    const n: number = cycle.chart.length;
    let best: IAutoMovieSolidCycle.IFoot = {
      segment: 0,
      share: 0,
      distance: Infinity,
    };
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
  export function centre(
    cycle: Pick<IAutoMovieSolidCycle.ICycle, "chart">,
  ): [number, number] {
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
