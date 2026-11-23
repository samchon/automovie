import type { IAutoMovieMotionHumanTiming } from "./IAutoMovieMotionHumanTiming";

/**
 * The kinds of a touch and how each moves in the region's surface frame: the
 * social touch gestures of Jung et al. 2017 (the corpus of social touch)
 * reduced to a lift off the surface along its normal (a tap, a pat), a travel
 * along it (a stroke, a rub, a scratch) or neither (a press, a squeeze, a
 * hold), with the repetition's length and the fingers' curl.
 *
 * A stroke moves at the pleasant-touch speed of Loken et al. 2009 (1 to 10
 * cm/s; the peak is set to 5 cm/s). The other periods and every amplitude are
 * provisional shares of the hand's length.
 */
export namespace IAutoMovieMotionHumanTouchForm {
  /** How the effector moves on the region. */
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

  /** Which way the travel runs on the region: up its surface, or across it. */
  export type Tangent = (readonly ["up", "across"])[number];

  /** One kind's movement. */
  export interface IForm {
    /** The lift's greatest height, a share of the hand's length. */
    lift: number;

    /** The travel's greatest offset each way, a share of the hand's length. */
    travel: number;

    /** One repetition's length; ignored when `speed` is given. */
    period: IAutoMovieMotionHumanTiming.Span;

    /**
     * The travel's peak speed, metres per second; sets the period when present
     * (`2 pi travel hand / speed`, the hand length of the body). Only the
     * stroke has one, 0.05 m/s, inside the pleasant-touch range of 1 to 10 cm/s
     * (Loken et al. 2009; `AutoMovieMotionHumanTouchForm.FORMS`); the other
     * forms keep their `period`.
     */
    speed?: number;

    /** Extra flexion of every finger joint, degrees. */
    curl: number;
  }
}
