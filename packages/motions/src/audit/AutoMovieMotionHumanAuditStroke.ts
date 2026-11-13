import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a repetition is on a displayed motion, what counts as a turning point and what does not.
 * @evidence contracts/development/implementation.md#principled-implementation Extremum detection with hysteresis: an extreme is confirmed by a retreat of the stated prominence, the standard reading of peaks in a sampled signal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass that tracks the running extreme of the current direction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Counts what the scalar does, never what a plan says it repeats; no smoothing hides a missing or an extra swing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in samples, constant memory beside the result.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the scalar handed in; the grid is `IAutoMovieMotionHumanAuditMotion.grid`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditStroke {
  /**
   * One turning point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation When and how far, the two facts a repetition is checked by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the audit's test and by law tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IExtreme {
    /** When the scalar turns, film seconds. */
    seconds: number;

    /** The scalar there, in its own unit. */
    value: number;
  }

  /**
   * The turning points of a span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it lists and in which order.
   * @evidence contracts/development/design.md#principled-representation Peaks and troughs apart, since a law names one of them as its repetition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two lists; counts and excursions are read off them by the caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No derived member that could disagree with the lists.
   */
  export interface IResult {
    /** The confirmed maxima, in film order. */
    peaks: IExtreme[];

    /** The confirmed minima, in film order. */
    troughs: IExtreme[];
  }

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input with its unit and the failures.
   * @evidence contracts/development/implementation.md#principled-implementation While rising the running maximum is kept and confirmed by a fall of the prominence; while falling the running minimum, by a rise of it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop with the two symmetric confirmations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The span's first sample is never an extreme, and a plateau counts once, at its first sample.
   * @evidence contracts/development/implementation.md#efficient-algorithms One evaluation of the scalar per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading; the grid is the audit's own.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function measure(
    signal: (seconds: number) => number,
    from: number,
    to: number,
    prominence: number,
    rate: number = 120,
  ): IResult {
    if (!(prominence > 0))
      throw new Error("A stroke reading needs a positive prominence");
    const out: IResult = { peaks: [], troughs: [] };
    const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      from,
      to,
      rate,
    );
    const first: number = signal(times[0]!);
    let high: IExtreme = { seconds: times[0]!, value: first };
    let low: IExtreme = { seconds: times[0]!, value: first };
    let direction: "up" | "down" | null = null;
    for (let i: number = 1; i < times.length; i++) {
      const now: IExtreme = { seconds: times[i]!, value: signal(times[i]!) };
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
