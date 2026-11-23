import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

/**
 * How far a flat palm laid along a thigh must stand off the skin at its
 * middle so its sides clear the thigh's curve: the sagitta of half the
 * palm's breadth on the thigh's radius, `h^2 / (2 r)`. A depth read along
 * the normal at the palm's middle does not see the curve falling away
 * under the thumb and the little finger, which then enter the thigh.
 *
 * @param body The body, for its hand length and thigh radius.
 * @returns The lift, metres.
 */
export function palmSagitta(body: IAutoMovieMotionHumanBody): number {
  const half: number = (palmSagitta.PALM_BREADTH * body.measure.hand) / 2;
  return (half * half) / (2 * body.measure.thighRadius);
}

/**
 * Companion constants of {@link palmSagitta}.
 */
export namespace palmSagitta {
  /** A hand's breadth across the palm as a share of its length (provisional anthropometric ratio, as `seatedHands` reads it). */
  export const PALM_BREADTH: number = 0.45;
}
