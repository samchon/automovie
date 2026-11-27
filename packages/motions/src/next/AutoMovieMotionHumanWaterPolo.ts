import { scoreWaterPoloGoal as scoreWaterPoloGoalLaw } from "../sport/internal/scoreWaterPoloGoal";

/**
 * Water polo: the credit of the direct, airborne portion of a shot. The same
 * resolved flight that displays the ball supplies its radius, centre and the
 * first contact or takeover that can end a scoring opportunity; the fixed
 * goal's mouth faces the field with +Z and its +Y begins at the waterline.
 * `scoreGoal` is a reader of the film, so it returns its named result and no
 * chain.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `scoreGoal`: Score the direct, airborne portion of a water polo shot.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanWaterPolo} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanWaterPolo {
  /**
   * Score the direct, airborne portion of a water polo shot. The same resolved
   * flight that displays the ball supplies its radius, centre, and the first
   * contact or takeover that can end a scoring opportunity. The fixed mouth's
   * +Z faces the field and its +Y begins at the waterline.
   *
   * @param params The `film` displaying both the ball and the fixed goal, the
   *   `ball`'s subject id through catch, carry and shot, and the fixed placed
   *   `goal` with the physical "mouth" aperture.
   * @returns Each credited goal, in film order.
   */
  export const scoreGoal: typeof scoreWaterPoloGoalLaw = scoreWaterPoloGoalLaw;
}
