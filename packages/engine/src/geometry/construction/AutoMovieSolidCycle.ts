/**
 * A trim cycle of a face in its own chart: the closed boundary of the face's
 * kept region, a sequence of shared vertices with their charts on this face
 * and, per segment, the neighbour face across it with the segment's ends in
 * the neighbour's chart.
 *
 * Kinds, as `AutoMovieSolidMesh.ILoop`: a `hole` encloses a region of
 * the chart and the face keeps its outside; a `start` or `end` cycle winds
 * once round the face's periodic phase and the face keeps the stations above
 * or below it. Membership is read in the chart: the crossing number of the
 * cycle's polygon for a hole (its phases moved by whole periods to the
 * cycle's own), the cycle's station at the point's phase for a winding cycle.
 *
 * @evidence contracts/common.md#principled-implementation Which side a trim keeps is read by crossing parity on the cycle's own chart polygon, each segment on the phase branch nearest the point, so periodic faces read correctly.
 * @evidence contracts/common.md#clear-and-simple-design One cycle record and its readings: kept, station, foot, centre and shift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cycle that turns back in phase is counted by parity, not by an assumed monotone order.
 * @evidence contracts/common.md#meaningful-documentation States the three kinds and which side each keeps.
 * @evidence contracts/performance.md#efficient-algorithms Every reading is linear in the cycle's vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work A hole's centre is computed once per reading and shared by its segments.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readings allocate only their small results.
 */
export namespace AutoMovieSolidCycle {
  /** One cycle. */
  export interface ICycle {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Mesh vertex indices, in cycle order. */
    vertices: number[];

    /** Each vertex's chart point `[u, v]` on this face, `v` unwrapped along the cycle. */
    chart: [number, number][];

    /** Per segment `k` (vertex `k` to `k + 1`, the last closing the cycle): the neighbour face across it. */
    neighbours: INeighbour[];
  }

  /** The face across one segment and the segment's ends in its chart. */
  export interface INeighbour {
    /** The neighbour face's index. */
    face: number;

    /** The segment's first vertex in the neighbour's chart. */
    from: [number, number];

    /** The segment's second vertex in the neighbour's chart. */
    to: [number, number];
  }

  /** A point's foot on a cycle. */
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
   */
  export function kept(cycle: Pick<ICycle, "kind" | "chart">, u: number, v: number, period: number | undefined): boolean {
    const n: number = cycle.chart.length;
    if (cycle.kind === "hole" || cycle.kind === "island") {
      const w: number = shift(v, centre(cycle)[1], period);
      let inside: boolean = false;
      for (let k: number = 0; k < n; k++) {
        const a: [number, number] = cycle.chart[k]!;
        const b: [number, number] = cycle.chart[(k + 1) % n]!;
        if (a[1] > w !== b[1] > w && u < a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) inside = !inside;
      }
      return cycle.kind === "island" ? inside : !inside;
    }

    // A winding cycle: the parity of its crossings with the ray from the
    // point along the phase line toward the side the face keeps it from
    // (down the stations for a start cycle), each segment read on the
    // branch of the point's phase nearest it, so a cycle that turns back in
    // phase (a clipped detour) still counts right.
    const p: number = period ?? 2 * Math.PI;
    let count: number = 0;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const raw: [number, number] = cycle.chart[(k + 1) % n]!;
      const b: [number, number] = [raw[0], shift(raw[1], a[1], p)];
      const w: number = shift(v, (a[1] + b[1]) / 2, p);
      if (a[1] > w === b[1] > w) continue;
      const x: number = a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
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
   */
  export function station(cycle: Pick<ICycle, "chart">, v: number, period: number): number {
    const n: number = cycle.chart.length;
    const v0: number = cycle.chart[0]![1];
    const span: number = cycle.chart[n - 1]![1] - v0;
    const sense: number = span >= 0 ? 1 : -1;
    const local: number = v0 + sense * reduce(sense * (v - v0), period);
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = cycle.chart[k]!;
      const b: [number, number] = k + 1 < n ? cycle.chart[k + 1]! : [cycle.chart[0]![0], cycle.chart[0]![1] + sense * period];
      if ((local - a[1]) * (local - b[1]) <= 0 && a[1] !== b[1]) return a[0] + ((local - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
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
   */
  export function foot(cycle: Pick<ICycle, "chart">, u: number, v: number, period: number | undefined): IFoot {
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
      const s: number = dd > 0 ? Math.min(1, Math.max(0, ((u - a[0]) * dx + (w - a[1]) * dy) / dd)) : 0;
      const d: number = Math.hypot(u - a[0] - s * dx, w - a[1] - s * dy);
      if (d < best.distance) best = { segment: k, share: s, distance: d };
    }
    return best;
  }

  /** A cycle's chart centre, the mean of its points. */
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
   */
  export function shift(v: number, reference: number, period: number | undefined): number {
    return period === undefined ? v : v + period * Math.round((reference - v) / period);
  }
}

/** A value reduced to `[0, period)`. */
function reduce(x: number, period: number): number {
  const r: number = x % period;
  return r < 0 ? r + period : r;
}
