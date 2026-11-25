import { disarm as disarmLaw } from "../grappling/disarm";
import { disarmed as disarmedLaw } from "../grappling/disarmed";
import { heldHostage as heldHostageLaw } from "../grappling/heldHostage";
import { hostageHold as hostageHoldLaw } from "../grappling/hostageHold";

/**
 * A hostage scene: a hostage held by an arm and a disarm of a knife or a
 * handgun. The hold and the disarm are authored scenes with no source
 * (provisional).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `disarm`: A staged disarm (`IAutoMovieMotionHumanDisarm`).
 * - `hostageHold`: A hostage hold from behind
 *   (`IAutoMovieMotionHumanHostageHold`).
 * - `heldHostage`: The hostage of a hold
 *   (`IAutoMovieMotionHumanHostageHold.IHeld`): the body keeps the posture it
 *   entered with and walks backward with the holder for `SECONDS`, its root
 *   following the holder's displayed root and its feet stepping the same
 *   displacement, so the pair keeps its order.
 * - `disarmed`: The armed partner of a disarm
 *   (`IAutoMovieMotionHumanDisarm.IYield`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanHostage} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanHostage {
  /**
   * A staged disarm (`IAutoMovieMotionHumanDisarm`). The defender's hands close
   * on the armed arm by the stage-fight grab (`touch`, both palms squeezing):
   * for a knife on the armed wrist and the forearm, for a handgun on the armed
   * wrist and the pistol's slide over the barrel. The grab holds for the lever,
   * then the hand on the wrist takes the weapon: from `taken` its grip carries
   * the weapon and it holds it after the action, while the other hand lets go.
   * The armed partner performs `disarmed`, whose hand opens at the same `taken`
   * instant, so the weapon has one owner at every instant. A partner who does
   * not hold the weapon is refused; a wrist out of reach is refused by the
   * grab, with the distance named.
   */
  export import disarm = disarmLaw;

  /**
   * A hostage hold from behind (`IAutoMovieMotionHumanHostageHold`). The free
   * arm lies across the hostage's chest or throat and the weapon hand brings
   * the held weapon's point to the authored region, both by one touch held for
   * the hold (`touch`, the weapon's point standing in for the hand). Once both
   * are in place the pair walks backward the authored distance: the holder's
   * feet step it, the root travels it on one minimum-jerk profile and both
   * hands travel with it, so they stay on the hostage, who performs
   * `heldHostage` and steps the same way.
   */
  export import hostageHold = hostageHoldLaw;

  /**
   * The hostage of a hold (`IAutoMovieMotionHumanHostageHold.IHeld`): the body
   * keeps the posture it entered with and walks backward with the holder for
   * `SECONDS`, its root following the holder's displayed root and its feet
   * stepping the same displacement, so the pair keeps its order. The holder is
   * composed before the hostage, so its root is placed to be read.
   */
  export import heldHostage = heldHostageLaw;

  /**
   * The armed partner of a disarm (`IAutoMovieMotionHumanDisarm.IYield`). The
   * partner keeps the posture it entered with; its armed forearm turns with the
   * lever from the defender's grip to the take, and its hand opens at the
   * defender's `taken` instant, read from the disarm's own placed plan, where
   * its grip on the weapon ends, so the weapon passes to the defender's hand
   * with one owner at every instant.
   */
  export import disarmed = disarmedLaw;
}
