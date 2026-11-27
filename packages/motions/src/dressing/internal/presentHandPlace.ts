import type {
  AutoMovieHumanSide,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/HumanFrame";

/**
 * Where a presented hand's palm goes: where the arm reaches with the upper arm
 * hanging and the forearm level ahead, `INWARD` of the shoulder's half width
 * out from the midline, the upper arm's length below the shoulder, and the
 * forearm and half the hand ahead, all from the body's own measure.
 *
 * @param measure The body's shoulder half width and height and its arm's
 *   lengths.
 * @param side The hand.
 * @param frame The performer's floor frame: its root and heading.
 * @returns The palm's world point, metres.
 */
export function presentHandPlace(
  measure: presentHandPlace.IMeasure,
  side: AutoMovieHumanSide,
  frame: IAutoMovieMotionHumanFrame,
): IAutoMovieVector3 {
  // Toward the midline (`+X` is the performer's left).
  return HumanFrame.point(frame, {
    x:
      (side === "left" ? 1 : -1) *
      presentHandPlace.INWARD *
      measure.shoulderHalfWidth,
    y: measure.shoulderHeight - measure.upperArm - frame.origin.y,
    z: measure.forearm + measure.hand / 2,
  });
}

/** Companion constants and types of {@link presentHandPlace}. */
export namespace presentHandPlace {
  /**
   * How far out from the midline the presented hand comes, as a share of the
   * shoulder's half width (provisional: the forearm turned in, the hand before
   * the body's middle, where either of a partner's hands takes it).
   */
  export const INWARD: number = 0.3;

  /** What the place reads of a body's measure. */
  export type IMeasure = Pick<
    IAutoMovieBodyMeasure,
    "shoulderHalfWidth" | "shoulderHeight" | "upperArm" | "forearm" | "hand"
  >;
}
