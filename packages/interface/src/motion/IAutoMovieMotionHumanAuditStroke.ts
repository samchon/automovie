/**
 * How many times a repeated movement goes out and back as displayed, and how
 * far each time: the turning points of one scalar read off a displayed motion.
 *
 * A pat that is asked three times shows three lifts of the hand, a wave of four
 * beats four swings, a squat of five repetitions five dips of the hips.
 * Whatever the scalar is (a hand's height over a surface, a hip's height, a
 * wrist's place along a stroke's line), its repetitions are its peaks and
 * troughs. A turning point is counted only when the scalar has come back from
 * it by at least `prominence`, so the ripple of a blend or of a held hand's
 * sway is not a repetition, and an end of the span is not a turning point: the
 * scalar must move away from an extreme on both sides.
 */
export namespace IAutoMovieMotionHumanAuditStroke {
  /** One turning point. */
  export interface IExtreme {
    /** When the scalar turns, film seconds. */
    seconds: number;

    /** The scalar there, in its own unit. */
    value: number;
  }

  /** The turning points of a span. */
  export interface IResult {
    /** The confirmed maxima, in film order. */
    peaks: IAutoMovieMotionHumanAuditStroke.IExtreme[];

    /** The confirmed minima, in film order. */
    troughs: IAutoMovieMotionHumanAuditStroke.IExtreme[];
  }
}
