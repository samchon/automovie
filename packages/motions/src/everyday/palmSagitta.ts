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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, the formula and the failure it prevents.
 * @evidence contracts/development/implementation.md#principled-implementation A circular section's sagitta over the palm's half breadth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One formula.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The breadth ratio is a named provisional anthropometric constant; the radius is the body's own.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function palmSagitta(body: IAutoMovieMotionHumanBody): number {
  const half: number = (palmSagitta.PALM_BREADTH * body.measure.hand) / 2;
  return (half * half) / (2 * body.measure.thighRadius);
}

/**
 * Companion constants of {@link palmSagitta}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ratio and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation A share of the hand's length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One ratio, read by the formula.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named, not repeated as a bare number.
 */
export namespace palmSagitta {
  /** A hand's breadth across the palm as a share of its length (provisional anthropometric ratio, as `seatedHands` reads it). */
  export const PALM_BREADTH: number = 0.45;
}
