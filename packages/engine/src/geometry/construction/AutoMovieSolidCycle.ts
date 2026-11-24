import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

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
      ...(c.partition === undefined ? {} : { partition: c.partition }),
      ...(c.exact === undefined ? {} : { exact: c.exact }),
      ...(c.segments === undefined ? {} : { segments: c.segments.slice() }),
    };
  }

  /**
   * Carry a marked planar split boundary's angular partition through its
   * retained source rows. Use the original row's count to partition the
   * accumulated world chord length and normal rotation. Each boundary span
   * takes the largest measured length and turn over the retained stations. The
   * maximum of the two normalized increments allocates space to both
   * requirements without comparing millimetres to radians. Sampling still uses
   * exact split addresses, and every finer boundary vertex remains.
   *
   * @see https://doi.org/10.1002/nme.1620070405 Structured curvilinear grid lines follow a shared boundary parameter.
   * @see https://www.sciencedirect.com/science/article/pii/S0010448518302331 Curvature-adaptive surface sampling distributes work in the normal map.
   */
  export function partition(
    cycle: IAutoMovieSolidCycle.ICycle,
    authored: readonly number[],
    station: number,
    stations: readonly number[],
    surface: IAutoMovieSolidSurface,
  ): number[] | undefined {
    const chart: [number, number][] = cycle.chart;
    const period: number | undefined = surface.period;
    if (
      cycle.partition !== true ||
      authored.length < 3 ||
      chart.length < authored.length ||
      chart.length !== cycle.vertices.length ||
      period === undefined ||
      !(Number.isFinite(period) && period > 0) ||
      authored.some(
        (v, k): boolean =>
          !Number.isFinite(v) || (k > 0 && !(v > authored[k - 1]!)),
      ) ||
      !(authored.at(-1)! - authored[0]! < period) ||
      cycle.along !== undefined ||
      cycle.segments !== undefined ||
      chart.some(
        ([u, v], k): boolean =>
          u !== station ||
          !Number.isFinite(v) ||
          (k > 0 && !(v > chart[k - 1]![1])),
      ) ||
      !(chart.at(-1)![1] - chart[0]![1] < period)
    )
      return undefined;
    const fine: number[] = chart.map(([, v]): number => v);
    const bend: number[] = fine.map((): number => 0);
    const chord: number[] = fine.map((): number => 0);
    try {
      for (const u of stations) {
        const read =
          surface.jetAt?.(u) ??
          ((v: number): IAutoMovieSolidSurface.IJet => surface.jet(u, v));
        const row = fine.map((v) => {
          const jet = read(v);
          const point: AutoMovieVector3Tuple = [...jet.p];
          return { point, normal: Vec.unit(Vec.cross(jet.u, jet.v)) };
        });
        for (const [i, { point, normal }] of row.entries()) {
          const next = row[(i + 1) % fine.length]!;
          if (normal === null || next.normal === null) return undefined;
          const angle: number = Math.atan2(
            Vec.norm(Vec.cross(normal, next.normal)),
            Vec.dot(normal, next.normal),
          );
          bend[i] = Math.max(bend[i]!, angle);
          chord[i] = Math.max(chord[i]!, Vec.norm(Vec.sub(next.point, point)));
        }
      }
    } catch (error: unknown) {
      if (error instanceof AutoMovieLoftAdmissionError) return undefined;
      throw error;
    }
    const distance: number = chord.reduce(
      (sum, value): number => sum + value,
      0,
    );
    const rotation: number = bend.reduce(
      (sum, value): number => sum + value,
      0,
    );
    if (
      !(distance > 0 && Number.isFinite(distance)) ||
      !Number.isFinite(rotation)
    )
      return undefined;
    const measures: number[] = [0];
    for (const [i, length] of chord.entries())
      measures.push(
        measures.at(-1)! +
          Math.max(length / distance, rotation > 0 ? bend[i]! / rotation : 0),
      );
    const length: number = measures.at(-1)!;
    if (!(length > 0 && Number.isFinite(length))) return undefined;
    let index: number = -1;
    const selected: number[] = authored.map((_, k): number => {
      const target: number = (k * length) / authored.length;
      const last: number = fine.length - authored.length + k;
      ++index;
      while (
        index < last &&
        Math.abs(measures[index + 1]! - target) <
          Math.abs(measures[index]! - target)
      )
        ++index;
      return index;
    });
    const regular: boolean = selected.every((v, i): boolean => {
      const next: number | undefined = selected[i + 1];
      const gap: number =
        (next === undefined ? fine[selected[0]!]! + period : fine[next]!) -
        fine[v]!;
      return gap > 0 && gap < period / 2;
    });
    return regular ? selected : undefined;
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
