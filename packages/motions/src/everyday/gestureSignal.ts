import { minimumJerk } from "@automovie/engine";

/**
 * The signals a gesture's stroke rides, each a function of the stroke's share
 * in [0, 1] that starts at rest: a windowed oscillation for the repeated
 * strokes, a single rise and fall, and a rise held to the end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three signals and their common domain; each function states its formula and range.
 * @evidence contracts/development/design.md#principled-representation Pure dimensionless functions of the stroke share, which the strokes scale by their own amplitudes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The signals the hand, joint and self-touch strokes and their test read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's minimum-jerk profile; no gesture is special-cased.
 */
export namespace gestureSignal {
  /**
   * A periodic stroke signal that starts and ends at rest: `sin(2 pi n u)`
   * under a window easing in over the first and out over the last 15 % of
   * the stroke, so the hand leaves and rejoins its held goal smoothly.
   *
   * @param u Stroke share.
   * @param cycles Cycles.
   * @returns The signal in [-1, 1]; 0 at and outside the stroke's ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the signal, the window and its 15 % ramps, the range and the value outside the stroke.
   * @evidence contracts/development/implementation.md#principled-implementation A sine of the stroke's cycles under the smaller of two minimum-jerk ramps, so the signal and its slope start and end at zero and the hand joins its held goal without a jump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure signal shared by the wave, rub, scratch and head-shake strokes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 15 % ramp is a provisional shaping value named in the doc.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function oscillation(u: number, cycles: number): number {
    if (!(u > 0 && u < 1)) return 0;
    return (
      Math.sin(2 * Math.PI * cycles * u) *
      Math.min(minimumJerk(u / 0.15).s, minimumJerk((1 - u) / 0.15).s)
    );
  }

  /**
   * A single rise and fall over the stroke, `sin^2(pi u)`.
   *
   * @param u Stroke share.
   * @returns The signal in [0, 1]; 0 at and outside the stroke's ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, the range and the value outside the stroke.
   * @evidence contracts/development/implementation.md#principled-implementation A squared sine, whose value and slope are zero at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bump(u: number): number {
    return u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 2 : 0;
  }

  /**
   * A rise held to the end, for a push: minimum-jerk over the first 60 % of
   * the stroke.
   *
   * @param u Stroke share.
   * @returns The signal in [0, 1]; 1 from 60 % of the stroke on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile, its 60 % ramp and the range.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk profile of a point-to-point movement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 60 % ramp is a provisional shaping value named in the doc.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rise(u: number): number {
    return minimumJerk(u / 0.6).s;
  }
}
