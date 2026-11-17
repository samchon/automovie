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
 * @evidence contracts/development/common.md#meaningful-documentation seconds: When the scalar turns, film seconds.
 * @evidence contracts/development/design.md#principled-representation seconds: When the scalar turns, film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditStroke.ts (AutoMovieMotionHumanAuditStroke.measure, return); audit/AutoMovieMotionHumanAuditStroke.ts (AutoMovieMotionHumanAuditStroke.measure).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanAuditStroke.measure.
 */
export namespace IAutoMovieMotionHumanAuditStroke {
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
    peaks: IAutoMovieMotionHumanAuditStroke.IExtreme[];

    /** The confirmed minima, in film order. */
    troughs: IAutoMovieMotionHumanAuditStroke.IExtreme[];
  }
}
