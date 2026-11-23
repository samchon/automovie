import { HumanPolo as HumanPoloLaw } from "../lexicon/HumanPolo";

/**
 * A polo stroke from the saddle. The ball leaves the mallet at 20 m/s unless
 * `speed` says otherwise, and the trunk leans out over the side by at most 45
 * degrees by default.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `polo`: A polo stroke from the saddle (`IAutoMovieMotionHumanPolo`): carried
 *   on the saddle, the rider rises in the stirrups and turns the shoulders
 *   toward the swing's side; the arm and the held mallet turn as one about the
 *   right shoulder in the plane through the ball and the horse's level heading,
 *   the mallet at the angle the grip and the wrist's deviation give, from the
 *   carry and the cocked top of the backswing, the arm short of straight up
 *   along the upright trunk, down through the ball at the contact, the rider
 *   leaning out over the side as it comes down, and on to the finish; the ball
 *   is launched along the swing at the contact.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanPolo} in
 * `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanPolo {
  /**
   * A polo stroke from the saddle (`IAutoMovieMotionHumanPolo`): carried on the
   * saddle, the rider rises in the stirrups and turns the shoulders toward the
   * swing's side; the arm and the held mallet turn as one about the right
   * shoulder in the plane through the ball and the horse's level heading, the
   * mallet at the angle the grip and the wrist's deviation give, from the carry
   * and the cocked top of the backswing, the arm short of straight up along the
   * upright trunk, down through the ball at the contact, the rider leaning out
   * over the side as it comes down, and on to the finish; the ball is launched
   * along the swing at the contact. Register `HumanPolo` to use it.
   */
  export const polo: typeof HumanPoloLaw = HumanPoloLaw;
}
