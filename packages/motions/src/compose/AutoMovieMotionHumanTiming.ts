/**
 * How long an effector takes to travel a distance.
 *
 * Two rules, and which one a movement takes:
 *
 * - {@link AutoMovieMotionHumanTiming.transport}: a movement in free space
 *   (a gesture's preparation, a hand to a rest place, a retraction) lasts
 *   `0.25 + 0.5 D` seconds for `D` metres. Provisional: a gesture's
 *   preparation lasts a few tenths of a second and reaching time grows with
 *   distance (Fitts 1954).
 * - {@link AutoMovieMotionHumanTiming.aimed}: a movement that must stop on a
 *   target of a given width lasts `a + b lg A + c W` for an amplitude `A` in
 *   millimetres and a width `W`, the two-factor model McIntosh, Mon-Williams
 *   and Tresilian (2018, J. Exp. Psychol. Hum. Percept. Perform. 44:1022,
 *   table 1) fitted to reach-to-grasp times, with a = -306.07 ms, b = 297.27
 *   ms per decade and c = 0.65 ms per millimetre (r^2 = 0.97). Amplitudes
 *   below the study's shortest (170 mm) take its value, since the fit is not
 *   valid there.
 *
 * {@link AutoMovieMotionHumanTiming.of} chooses: a place that is solid and
 * has a width is aimed at, any other is travelled to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both rules with their formulas, units and sources, which values are provisional, and which rule a movement takes.
 * @evidence contracts/development/design.md#principled-representation Movement time as a function of distance, and of distance and target width where the movement must stop on something, the two cases motor-control studies separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions and their constants; the only owner of default durations, so one modifier can scale them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is a named constant with its source; no body part or law is named.
 */
export namespace AutoMovieMotionHumanTiming {
  /** The free-space rule's time at no distance, seconds (provisional). */
  export const BASE: number = 0.25;

  /** The free-space rule's seconds per metre (provisional). */
  export const RATE: number = 0.5;

  /** McIntosh et al. 2018 two-factor intercept, seconds. */
  export const INTERCEPT: number = -0.30607;

  /** McIntosh et al. 2018 amplitude slope, seconds per decade of millimetres. */
  export const AMPLITUDE: number = 0.29727;

  /** McIntosh et al. 2018 width slope, seconds per metre (0.65 ms per mm). */
  export const WIDTH: number = 0.65;

  /** The shortest amplitude the fit was measured at, metres. */
  export const SHORTEST: number = 0.17;

  /**
   * The time of a movement in free space.
   *
   * @param distance Metres travelled.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input's unit and the result's; the namespace gives the formula and its standing.
   * @evidence contracts/development/implementation.md#principled-implementation `BASE + RATE D`, a time that grows with distance from a floor of a few tenths of a second; named provisional.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative distance counts as none, since a length cannot be negative; both coefficients are named provisional constants.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One expression with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function transport(distance: number): number {
    return BASE + RATE * Math.max(0, distance);
  }

  /**
   * The time of a movement that stops on a target.
   *
   * @param distance Metres travelled.
   * @param width The target's width across the grip or the touch, metres; 0 for a point.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and meaning and the result's; the namespace gives the formula and its source.
   * @evidence contracts/development/implementation.md#principled-implementation McIntosh et al. 2018's two-factor model with the group coefficients of its table 1.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression over four named constants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is not extrapolated below its shortest measured amplitude; a negative width counts as none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One expression with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache; `HumanPrehension.nominal` delegates here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function aimed(distance: number, width: number): number {
    return (
      INTERCEPT +
      AMPLITUDE * Math.log10(1000 * Math.max(SHORTEST, distance)) +
      WIDTH * Math.max(0, width)
    );
  }

  /**
   * The time of a movement to a place, by the rule the place asks for.
   *
   * @param distance Metres travelled.
   * @param place Whether the place is solid, and its width when it has one.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and that the place decides the rule; the namespace states the rule.
   * @evidence contracts/development/implementation.md#principled-implementation A movement that must stop on a solid thing of a known width is an aimed movement; a movement to a free place has no width to be accurate to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One condition over the two rules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solid place without a width takes the free-space rule instead of an invented width.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `aimed` and `transport`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One condition with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    distance: number,
    place: { solid: boolean; width?: number | undefined },
  ): number {
    return place.solid && place.width !== undefined
      ? aimed(distance, place.width)
      : transport(distance);
  }
}
