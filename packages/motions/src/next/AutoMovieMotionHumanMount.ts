import { HumanLeadHorse as HumanLeadHorseLaw } from "../lexicon/internal/HumanLeadHorse";
import { HumanLunge as HumanLungeLaw } from "../lexicon/internal/HumanLunge";
import { HumanLungeChange as HumanLungeChangeSource } from "../lexicon/internal/HumanLungeChange";
import { HumanLungeHands as HumanLungeHandsSource } from "../lexicon/internal/HumanLungeHands";
import { HumanLungePivot as HumanLungePivotSource } from "../lexicon/internal/HumanLungePivot";
import { HumanMountReach as HumanMountReachSource } from "../lexicon/internal/HumanMountReach";
import { HumanMountRider as HumanMountRiderSource } from "../lexicon/internal/HumanMountRider";
import { HumanMounted as HumanMountedLaw } from "../lexicon/internal/HumanMounted";
import { HumanMountedPresentation as HumanMountedPresentationSource } from "../lexicon/internal/HumanMountedPresentation";
import { HumanRide as HumanRideLaw } from "../lexicon/internal/HumanRide";
import { HumanTendHorse as HumanTendHorseLaw } from "../lexicon/internal/HumanTendHorse";
import { HumanUnseat as HumanUnseatLaw } from "../lexicon/internal/HumanUnseat";

/**
 * Living mounts: riding a horse, handling it from the ground and leaving its
 * saddle. The horse prop owns the carrier's contacts and course, and every
 * method here reads them at the film second it acts.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `rideHorse`: Riding: a seated person carried by a support that moves by
 *   itself, such as a car, a bicycle or a horse given to the performance as a
 *   moving prop (`AutoMovieMotionHumanObject.prop` with a motion).
 * - `leadHorse`: Keep one handler's hand on the horse's actual moving lead frame.
 * - `tendHorse`: A handler's hand on a horse's actual moving contact while the
 *   handler stands: brushing, headgear, lead, saddle and a held hoof.
 * - `lunge`: Lunge a horse from the circle's centre
 *   (`IAutoMovieMotionHumanLunge`): the handler turns on the spot to face the
 *   horse's root as it circles, the line hand on the lunge line where the
 *   horse's ride lays it and the whip hand low and aimed at the quarters.
 * - `unseat`: A rider leaving a moving saddle (`IAutoMovieMotionHumanUnseat`):
 *   carried on the saddle until the release, then flying from the saddle's own
 *   velocity with the fall's push built over `HumanUnseatFlight.TAKE` (no jump
 *   in velocity), turning onto the back as the knockdown's fitted lie
 *   (`KnockdownFloor`) with the head along the fall and the falling side's hand
 *   reaching the floor first, and sliding to a stop; or dragged on the floor
 *   behind a foot held in its stirrup until a breakaway stirrup frees it; or
 *   stepping clear onto the feet; or slumping over the neck, held by the saddle
 *   and a hand in the mane, or sliding off.
 * - `mounted`: Plan a mounted performance on a moving carrier
 *   (`IAutoMovieMotionHumanMounted`): seat figures in a carrier contact's
 *   frame, joined by transfers that keep a support held through them, with each
 *   named support acquired, held and released on the figures' clock and the
 *   whole carried by the carrier's moving contact.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanLungeChange`: The lunge's hands over time (`HumanLunge`): which hand
 *   holds the line and which the whip, and how they change over at a change of
 *   rein.
 * - `HumanLungeHands`: The lunge's hands and feet records (`HumanLunge`): the
 *   feet's plant windows between their pivot swings, the whip hand's grip and
 *   the line hand's contact check.
 * - `HumanLungePivot`: A handler's feet turning on the spot to follow a moving
 *   bearing: pivot steps, each the foot on the side of the turn swinging round
 *   the centre first and the other following, taken whenever the bearing has
 *   moved `TRIGGER` from the feet.
 * - `HumanMountedPresentation`: A mounted presentation: a rider seated in the
 *   saddle turns the trunk toward a target before the arms present to it, since
 *   the seat and the legs keep the pelvis facing the horse's travel.
 * - `HumanMountReach`: How far a seated rider leans the trunk forward to reach
 *   what the hands hold (`HumanMountRider.lean`), in closed form: flexing the
 *   spine turns everything above it about the spine joint's flexion axis, so
 *   each shoulder runs on a circle read from three forward-kinematics passes,
 *   and the least flexion bringing both points within reach is found on the
 *   intersection of the reachable arcs.
 * - `HumanMountRider`: What a seated rider's own body gives to stay on a mount's
 *   parts: the ankle that points a foot down to a pedal the leg would not
 *   reach, and the trunk that leans forward to a bar the arms would not reach.
 *
 * Use `IAutoMovieMotionHumanRide.IParams` for the ride. Ground handling uses
 * `IAutoMovieMotionHumanLeadHorse`, `IAutoMovieMotionHumanTendHorse`, or
 * `IAutoMovieMotionHumanLunge`. Use `IAutoMovieMotionHumanUnseat` for leaving
 * the saddle and `IAutoMovieMotionHumanMounted` for mounted figures.
 */
export namespace AutoMovieMotionHumanMount {
  /**
   * Riding: a seated person carried by a support that moves by itself, such as
   * a car, a bicycle or a horse given to the performance as a moving prop
   * (`AutoMovieMotionHumanObject.prop` with a motion).
   *
   * The rider sits down on the support first (`sit` on its seat where it stands
   * at that second; `AutoMovieMotionHumanObject.seat` reads a saddle with its pedals or
   * stirrups) and then rides it: the seated posture is carried rigidly with the
   * support, turning, leaning and pitching as it does, the seat and each foot
   * that rested on it bearing on it, so nothing slides in the support's frame.
   * The arms, the hands, the head and the trunk's turn are yielded, so
   * steering, holding on, waving, looking and aiming from the saddle are
   * actions performed over the ride. Register `HumanRide.ride` to use it.
   *
   * With `rising` the rider posts to a trot, by a stride time or on the strides
   * of a cue track; with `feet` each foot stays on a part that moves within the
   * support, a pedal on its crank or a stirrup; with `hands` each hand holds a
   * grip, a rein or a wheel's rim and follows it the same way, the trunk
   * leaning to keep the grips in reach. With `equestrian` the rider can
   * articulate relative to the saddle on the horse's touchdown clock, ride an
   * authored jump, or turn over one shoulder on a film cue. The ride passes its
   * original seat on as its base for dismounting.
   */
  export import rideHorse = HumanRideLaw;

  /**
   * Keep one handler's hand on the horse's actual moving lead frame.
   *
   * The base action owns steps and the lead remains on the posed horse. The
   * overlay acquires the rope and releases it over equal authored intervals.
   */
  export const leadHorse: typeof HumanLeadHorseLaw = HumanLeadHorseLaw;

  /**
   * A handler's hand on a horse's actual moving contact while the handler
   * stands: brushing, headgear, lead, saddle and a held hoof.
   *
   * The action is an arm overlay: the carrier under it, a stand, a crouch or a
   * walk, owns the handler's feet and trunk. One hand acquires the named
   * contact over `transition` on a minimum-jerk share, holds it, and releases
   * it over `transition`; the contact is read from the horse prop at each film
   * second, so it follows the horse's own responses, such as a hoof the horse
   * lifts. A brushing hand strokes back and forth along the contact's line, one
   * stroke out and back over the hold. While fully held the displayed hand must
   * lie within 10 mm of the contact's surface, or the action refuses: an
   * unreachable care or tack placement is refused, never clamped.
   */
  export const tendHorse: typeof HumanTendHorseLaw = HumanTendHorseLaw;

  /**
   * Lunge a horse from the circle's centre (`IAutoMovieMotionHumanLunge`): the
   * handler turns on the spot to face the horse's root as it circles, the line
   * hand on the lunge line where the horse's ride lays it and the whip hand low
   * and aimed at the quarters.
   *
   * The pelvis faces the horse's bearing from the centre between the feet at
   * every second, turning to it from the entry's heading over `transition`; the
   * feet pivot round that centre in steps (`HumanLungePivot`), each foot's
   * ankle and sole turned about the centre on a minimum-jerk share and lifted
   * on a half-sine of `LIFT` of stature while it swings, and the legs reach
   * them through the stance's leg goals (`StrikingStance.legs`). The line hand
   * closes on the horse's line contact as a lead is held (`HumanRideHands`,
   * `HumanMountRider.hold`), the palm on the line; the whip hand holds the whip
   * out to its side at hip height, its shaft turned toward the quarters from
   * the bearing and below level (`HumanLungeHands.whip`). At a change of rein
   * the hands change over (`HumanLungeChange`): the whip hand comes to the line
   * and closes beside the line hand, the line hand takes the whip from it, and
   * each goes out to its new side as the horse's ride carries the line over.
   * Both arms are laid on one planned course (`courseArmGoal`). A pivot step
   * takes two of `step.period`'s swings, one per foot.
   */
  export const lunge: typeof HumanLungeLaw = HumanLungeLaw;

  /**
   * A rider leaving a moving saddle (`IAutoMovieMotionHumanUnseat`): carried on
   * the saddle until the release, then flying from the saddle's own velocity
   * with the fall's push built over `HumanUnseatFlight.TAKE` (no jump in
   * velocity), turning onto the back as the knockdown's fitted lie
   * (`KnockdownFloor`) with the head along the fall and the falling side's hand
   * reaching the floor first, and sliding to a stop; or dragged on the floor
   * behind a foot held in its stirrup until a breakaway stirrup frees it; or
   * stepping clear onto the feet; or slumping over the neck, held by the saddle
   * and a hand in the mane, or sliding off. Register `HumanUnseat` to use it.
   */
  export const unseat: typeof HumanUnseatLaw = HumanUnseatLaw;

  /**
   * Plan a mounted performance on a moving carrier
   * (`IAutoMovieMotionHumanMounted`): seat figures in a carrier contact's
   * frame, joined by transfers that keep a support held through them, with each
   * named support acquired, held and released on the figures' clock and the
   * whole carried by the carrier's moving contact. Register `HumanMounted` to
   * use it.
   */
  export const mounted: typeof HumanMountedLaw = HumanMountedLaw;

  /**
   * The lunge's hands over time (`HumanLunge`): which hand holds the line and
   * which the whip, and how they change over at a change of rein.
   *
   * Before the change the first hand holds the line and the other the whip.
   * Over the change's first `transition` the line hand brings the line in to
   * the middle (the horse's ride moves the line there) while the whip hand
   * comes to it and closes on the line `GAP` nearer the horse, the whip still
   * in it; through the second both hold the line, and halfway through it the
   * first hand, its palm on the line where the whip's handle runs back from the
   * other fist, closes on the whip too, the other letting it go at the phase's
   * end, so both hold it between and it is never unheld; over the third the
   * first hand goes out with the whip to its side and the other keeps the line
   * as the ride carries it out to that side.
   */
  export import HumanLungeChange = HumanLungeChangeSource;

  /**
   * The lunge's hands and feet records (`HumanLunge`): the feet's plant windows
   * between their pivot swings, the whip hand's grip and the line hand's
   * contact check.
   */
  export import HumanLungeHands = HumanLungeHandsSource;

  /**
   * A handler's feet turning on the spot to follow a moving bearing: pivot
   * steps, each the foot on the side of the turn swinging round the centre
   * first and the other following, taken whenever the bearing has moved
   * `TRIGGER` from the feet.
   *
   * A step lays the feet `TRIGGER` past where the bearing will be when it ends,
   * so the pelvis, which faces the bearing, runs from that lead back through
   * the feet's heading to the same lag behind before the next step; between
   * steps the feet stand. The heading the pelvis keeps from the feet is the
   * hip's own rotation, bounded by `walkReach.TWIST`; a bearing that outruns
   * the steps beyond it is refused.
   */
  export import HumanLungePivot = HumanLungePivotSource;

  /**
   * A mounted presentation: a rider seated in the saddle turns the trunk toward
   * a target before the arms present to it, since the seat and the legs keep
   * the pelvis facing the horse's travel.
   *
   * A standing presentation reaches `HumanWeaponPresent.TURN` off the heading
   * by the arms alone. In the saddle the trunk adds its own axial rotation,
   * which `StrikingBlade.turned` splits `AutoMovieMotionHumanTrunk.CHEST` to
   * the chest and the rest to the lumbar spine, so a rider presents as far off
   * the horse's heading as the chest's and the spine's axial ranges
   * (`AutoMovieEngineDefaultHumanoidRom`, the bound `HumanSupportAim` keeps a moving
   * support's aim within) allow plus the arms' own `TURN`, which reaches behind
   * the rider's shoulders, short of dead astern: there the horse must turn.
   */
  export import HumanMountedPresentation = HumanMountedPresentationSource;

  /**
   * How far a seated rider leans the trunk forward to reach what the hands hold
   * (`HumanMountRider.lean`), in closed form: flexing the spine turns
   * everything above it about the spine joint's flexion axis, so each shoulder
   * runs on a circle read from three forward-kinematics passes, and the least
   * flexion bringing both points within reach is found on the intersection of
   * the reachable arcs.
   */
  export import HumanMountReach = HumanMountReachSource;

  /**
   * What a seated rider's own body gives to stay on a mount's parts: the ankle
   * that points a foot down to a pedal the leg would not reach, and the trunk
   * that leans forward to a bar the arms would not reach.
   */
  export import HumanMountRider = HumanMountRiderSource;
}
