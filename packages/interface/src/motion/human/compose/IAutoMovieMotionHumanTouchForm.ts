import type { IAutoMovieMotionHumanTiming } from "./IAutoMovieMotionHumanTiming";

/**
 * The kinds of a touch and how each moves in the region's surface frame: the
 * social touch gestures of Jung et al. 2017 (the corpus of social touch)
 * reduced to a lift off the surface along its normal (a tap, a pat), a
 * travel along it (a stroke, a rub, a scratch) or neither (a press, a
 * squeeze, a hold), with the repetition's length and the fingers' curl.
 *
 * A stroke moves at the pleasant-touch speed of Loken et al. 2009 (1 to 10
 * cm/s; the peak is set to 5 cm/s). The other periods and every amplitude
 * are provisional shares of the hand's length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lift: The lift's greatest height, a share of the hand's length. travel: The travel's greatest offset each way, a share of the hand's length. speed: The travel's peak speed, metres per second; sets the period when present.
 * @evidence contracts/development/design.md#principled-representation lift: The lift's greatest height, a share of the hand's length. travel: The travel's greatest offset each way, a share of the hand's length. speed: The travel's peak speed, metres per second; sets the period when present.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.curled, kind); compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.period, kind); compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.tangent, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.bend, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.laid, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.rest, tangent).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTiming.Span identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchForm {
  /**
   * How the effector moves on the region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a kind selects; the namespace states the source and `FORMS` each kind's movement.
   * @evidence contracts/development/design.md#principled-representation The gesture names of the social touch corpus that differ in a surface frame; each maps to one row of `FORMS`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight literals, the key of `FORMS`; a law names a kind and never a lift or a travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union, so `FORMS` is exhaustive and an unknown kind does not compile.
   */
  export type Kind = (readonly [
    "tap",
    "pat",
    "stroke",
    "rub",
    "press",
    "squeeze",
    "hold",
    "scratch",
  ])[number];

  /**
   * Which way the travel runs on the region: up its surface, or across it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two directions relative to the region's surface.
   * @evidence contracts/development/design.md#principled-representation A surface has two tangent directions; they are named by the world's up projected on it and its perpendicular.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two literals, read by the region's tangent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A named direction on the surface, not a free vector a law could point off it.
   */
  export type Tangent = (readonly ["up", "across"])[number];

  /**
   * One kind's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The lift and the travel in hand lengths, the repetition as a span or a peak speed, the curl in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by the touch stroke.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The speed is optional because only the stroke has a measured one.
   */
  export interface IForm {
    /** The lift's greatest height, a share of the hand's length. */
    lift: number;

    /** The travel's greatest offset each way, a share of the hand's length. */
    travel: number;

    /** One repetition's length; ignored when `speed` is given. */
    period: IAutoMovieMotionHumanTiming.Span;

    /** The travel's peak speed, metres per second; sets the period when present (`2 pi travel hand / speed`, the hand length of the body). Only the stroke has one, 0.05 m/s, inside the pleasant-touch range of 1 to 10 cm/s (Loken et al. 2009; {@link AutoMovieMotionHumanTouchForm}); the other forms keep their `period`. */
    speed?: number;

    /** Extra flexion of every finger joint, degrees. */
    curl: number;
  }
}
