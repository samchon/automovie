import type { IAutoMovieMotionHumanAuditStroke } from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * How many times a repeated movement really goes out and back, and how far
 * each time: the turning points of one scalar read off a displayed motion.
 *
 * A pat that is asked three times shows three lifts of the hand, a wave of
 * four beats four swings, a squat of five repetitions five dips of the
 * hips. Whatever the scalar is (a hand's height over a surface, a hip's
 * height, a wrist's place along a stroke's line), its repetitions are its
 * peaks and troughs. A turning point is counted only when the scalar has
 * come back from it by at least `prominence`, so the ripple of a blend or of
 * a held hand's sway is not a repetition, and an end of the span is not a
 * turning point: the scalar must move away from an extreme on both sides.
 */
export namespace AutoMovieMotionHumanAuditStroke {
  /**
   * Read a scalar's turning points between two film seconds.
   *
   * @param signal The scalar at a film second.
   * @param from Film seconds.
   * @param to Film seconds, at least `from`.
   * @param prominence How far the scalar must come back from an extreme for it to count, in its own unit, positive.
   * @param rate Samples per second.
   * @returns The peaks and the troughs.
   * @throws {Error} When the prominence or the rate is not positive, or the span is reversed.
   */
  export function measure(
    signal: (seconds: number) => number,
    from: number,
    to: number,
    prominence: number,
    rate: number = 120,
  ): IAutoMovieMotionHumanAuditStroke.IResult {
    if (!(prominence > 0))
      throw new Error("A stroke reading needs a positive prominence");
    const out: IAutoMovieMotionHumanAuditStroke.IResult = {
      peaks: [],
      troughs: [],
    };
    const times: number[] = AutoMovieMotionHumanAuditMotion.grid(
      from,
      to,
      rate,
    );
    const first: number = signal(times[0]!);
    let high: IAutoMovieMotionHumanAuditStroke.IExtreme = {
      seconds: times[0]!,
      value: first,
    };
    let low: IAutoMovieMotionHumanAuditStroke.IExtreme = {
      seconds: times[0]!,
      value: first,
    };
    let direction: "up" | "down" | null = null;
    for (let i: number = 1; i < times.length; i++) {
      const now: IAutoMovieMotionHumanAuditStroke.IExtreme = {
        seconds: times[i]!,
        value: signal(times[i]!),
      };
      if (now.value > high.value) high = now;
      if (now.value < low.value) low = now;
      if (direction !== "down" && now.value <= high.value - prominence) {
        if (high.seconds > times[0]!) out.peaks.push(high);
        direction = "down";
        low = now;
      } else if (direction !== "up" && now.value >= low.value + prominence) {
        if (low.seconds > times[0]!) out.troughs.push(low);
        direction = "up";
        high = now;
      }
    }
    return out;
  }
}
