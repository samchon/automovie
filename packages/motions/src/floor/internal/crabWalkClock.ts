import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

/**
 * The crab walk's clock: whole stride cycles over the travel, the body settling
 * onto its supports first, the travel's progress in cycles following one
 * minimum-jerk course (Flash and Hogan 1985) so the crawl leaves and arrives at
 * rest.
 *
 * @param distance The travel's length, metres.
 * @param stature The body's stature, metres.
 * @returns The clock.
 */
export function crabWalkClock(
  distance: number,
  stature: number,
): crabWalkClock.IClock {
  const cycles: number = Math.max(
    1,
    Math.ceil(distance / (crabWalkClock.STRIDE * stature)),
  );
  const travelling: number = cycles * crabWalkClock.CYCLE;
  const duration: number = crabWalkClock.SETTLE + travelling;
  const progress = (seconds: number): number =>
    cycles *
    AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (seconds - crabWalkClock.SETTLE) / travelling)),
    );
  return {
    cycles,
    stride: distance / cycles,
    duration,
    progress,
    at: (cycle: number): number => {
      // The second the progress reaches a cycle count, by bisection on the
      // monotone progress; read only while the plan is made.
      let lo: number = crabWalkClock.SETTLE;
      let hi: number = duration;
      for (let k: number = 0; k < crabWalkClock.HALVINGS; ++k) {
        const mid: number = (lo + hi) / 2;
        if (progress(mid) < cycle) lo = mid;
        else hi = mid;
      }
      return hi;
    },
  };
}

/** Companion constants, types and readings of {@link crabWalkClock}. */
export namespace crabWalkClock {
  /**
   * How long the body takes to settle onto its four supports, seconds:
   * authored.
   */
  export const SETTLE: number = 0.8;

  /** A stride's length, in statures: authored. */
  export const STRIDE: number = 0.18;

  /** How long one stride cycle takes, seconds: authored, a slow crawl. */
  export const CYCLE: number = 0.9;

  /** How high a swinging end lifts, metres: authored. */
  export const LIFT: number = 0.06;

  /** The halvings of a cycle's second: 40 leave 2^-40 of the plan's length. */
  export const HALVINGS: number = 40;

  /** The crawl's timing. */
  export interface IClock {
    /** The whole stride cycles over the travel. */
    cycles: number;

    /** One stride, metres. */
    stride: number;

    /** The plan's length, seconds. */
    duration: number;

    /** The travel's progress at a second, in cycles. */
    progress: (seconds: number) => number;

    /** The second the progress reaches a cycle count. */
    at: (cycle: number) => number;
  }

  /** One end of the crawl as the clock reads it. */
  export interface IEnd {
    /** The contact part at the end. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /**
     * Its phase in the stride cycle: 0 for the right hand and the left foot,
     * one half for the other pair, the diagonal sequence of a quadrupedal walk
     * (Hildebrand 1965).
     */
    phase: number;
  }

  /**
   * Where an end stands along the travel at a progress, in strides, and how
   * high it lifts: it swings over the first half of each of its cycles, on a
   * minimum-jerk course lifted on a half sine, and stands over the second.
   *
   * @param clock The crawl's clock.
   * @param phase The end's phase.
   * @param u The progress, cycles.
   * @returns The strides walked and the lift, metres.
   */
  export function step(
    clock: Pick<IClock, "cycles">,
    phase: number,
    u: number,
  ): readonly [number, number] {
    const c: number = u - phase;
    if (c <= 0) return [0, 0];
    const k: number = Math.floor(c);
    const f: number = c - k;
    if (k >= clock.cycles) return [clock.cycles, 0];
    if (f >= 0.5) return [k + 1, 0];
    const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(f / 0.5);
    return [k + s, Math.sin(Math.PI * s) * LIFT];
  }

  /**
   * Each end's plant windows: it bears from the settle to its first swing,
   * between its swings, and from its last landing to the end.
   *
   * @param clock The crawl's clock.
   * @param ends The ends.
   * @returns The windows, as shares of the plan.
   */
  export function contacts(
    clock: IClock,
    ends: readonly IEnd[],
  ): IAutoMovieMotionHumanContactWindow[] {
    const out: IAutoMovieMotionHumanContactWindow[] = [];
    for (const end of ends) {
      let from: number = SETTLE;
      for (let k: number = 0; k < clock.cycles; ++k) {
        const lift: number = clock.at(k + end.phase);
        const land: number = clock.at(k + end.phase + 0.5);
        if (lift > from)
          out.push({
            part: end.part,
            kind: "plant",
            from: from / clock.duration,
            to: lift / clock.duration,
            support: { kind: "ground" },
          });
        from = land;
      }
      out.push({
        part: end.part,
        kind: "plant",
        from: from / clock.duration,
        to: 1,
        support: { kind: "ground" },
      });
    }
    return out;
  }
}
