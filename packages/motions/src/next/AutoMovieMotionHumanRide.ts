import { HumanBicycleEffort as HumanBicycleEffortLaw } from "../lexicon/HumanBicycleEffort";
import { HumanBikeGuide as HumanBikeGuideLaw } from "../lexicon/HumanBikeGuide";
import { HumanBikeTransfer as HumanBikeTransferLaw } from "../lexicon/HumanBikeTransfer";
import { HumanBoard as HumanBoardLaw } from "../lexicon/HumanBoard";
import { HumanHandrimStroke as HumanHandrimStrokeLaw } from "../lexicon/HumanHandrimStroke";
import { HumanRide as HumanRideLaw } from "../lexicon/HumanRide";
import { HumanSurface as HumanSurfaceSource } from "../lexicon/HumanSurface";
import { HumanTravelCar as HumanTravelCarLaw } from "../lexicon/HumanTravelCar";
import { HumanTravelCarExit as HumanTravelCarExitLaw } from "../lexicon/HumanTravelCarExit";
import { HumanTravelLeaf as HumanTravelLeafLaw } from "../lexicon/HumanTravelLeaf";
import { spacecraftGlide as spacecraftGlideLaw } from "../spacecraft/spacecraftGlide";

/**
 * Riding a vehicle or travelling by one: a car, its exit and a leaf, a bicycle,
 * a wheelchair and a spacecraft's handrails. The moving prop owns the course
 * and the contacts, and every method here reads them at the film second it
 * acts.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `travelCar`: Getting into a car through its door: the person stands in the
 *   doorway with the back to the seat, sits down onto it sideways with the legs
 *   still outside, then swings round on the seat to face the way the seat
 *   faces, and the head is ducked under the door's top throughout.
 * - `travelCarExit`: Static rear-seat egress via the adjacent, already-open door.
 * - `travelLeaf`: Opening a door by its handle and holding it: the hand reaches
 *   the handle, closes on it and goes with it while the leaf swings, the person
 *   standing, and walking round with the leaf when the arm alone would lose the
 *   handle.
 * - `rideVehicle`: Riding: a seated person carried by a support that moves by
 *   itself, such as a car, a bicycle or a horse given to the performance as a
 *   moving prop (`HumanObject.prop` with a motion).
 * - `board`: Board a moving carrier's seat (`IAutoMovieMotionHumanBoard`): in the
 *   seat contact's moving frame the root travels from where it takes off to its
 *   seated place on the seat by a minimum-jerk share, so it leaves and lands
 *   with the seat's own velocity, rising `height` over the straight way on a
 *   parabola of the share; the shape blends from the entry into an upright
 *   astride seat with the legs hanging (`hangMountedLeg`), a held hand keeping
 *   its hold until `LET_GO` of the flight.
 * - `handrimStroke`: One single-handed or bilateral handrim engagement over a
 *   seated ride.
 * - `bicycleEffort`: Rise from the saddle while both feet follow their pedals and
 *   both hands follow the handlebar.
 * - `bikeGuide`: Wheel a bicycle by hand beside it, as a triathlete does through
 *   the transition lane.
 * - `bikeTransfer`: Enter or leave the same stopped bicycle at a race boundary,
 *   using the high-seat transfer and its displayed floor contacts.
 * - `spacecraftGlide`: An opt-in law for one coast inside a stationary
 *   spacecraft.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanSurface`: Surface travel under the performer.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanRide} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanRide {
  /**
   * Getting into a car through its door: the person stands in the doorway with
   * the back to the seat, sits down onto it sideways with the legs still
   * outside, then swings round on the seat to face the way the seat faces, and
   * the head is ducked under the door's top throughout. Register
   * `HumanTravelCar.getIn` to use it.
   *
   * People get into a car seat by sitting first and bringing the legs in after,
   * and lower the head under the roof's edge as they go (the "sit-then-swing"
   * entry of the ergonomics of vehicle ingress; Giacomin and Quattrocolo 1997,
   * Appl Ergon 28:261, describe it; the timing and the angles here are
   * provisional, not read from them). The sitting is `sit` onto the seat turned
   * to face out of the door; the swing turns the seated body about the seat's
   * middle by the minimum-jerk profile (Flash and Hogan 1985) over `SWING`
   * seconds. The duck is a forward flexion of the spine added wherever the
   * crown, inside the door's plane or within `HEAD` of it, would come nearer
   * than `CLEAR` to the opening's top; it is solved at `SAMPLES` instants at
   * plan time and grows and fades over `LEAD` seconds around each, so the head
   * goes down before it reaches the edge.
   *
   * Refused: an opening narrower than the body's chest (`reach` on `aperture`,
   * with the width needed), and one so low that even `DUCK` degrees of flexion
   * leave the crown above its top (`reach` on `aperture`, with the height
   * needed). First pass: the legs are carried round with the body and are not
   * lifted over the sill, and the door's leaf is taken as open.
   *
   * The crown is read by one reader prepared for the entry
   * (`HumanTrunk.preparePoint`). Each sampled instant's search resolves the
   * sitting posture there once and bisects the flexion on one
   * forward-kinematics reader, each trial changing the spine's flexion alone; a
   * refusal reports the excess the full duck leaves.
   */
  export import travelCar = HumanTravelCarLaw;

  /**
   * Static rear-seat egress via the adjacent, already-open door. Shippen (2012,
   * IJTTE 2:107–117) studied occupants leaving the rear seat through the
   * nearest door and measured lumbar flexion, lateral bending and axial
   * rotation. This provisional staging uses a seated turn and staggered ground
   * placements followed by the existing sit-to-stand law.
   * https://pure.coventry.ac.uk/ws/portalfiles/portal/4013131/shippen2comb.pdf
   */
  export import travelCarExit = HumanTravelCarExitLaw;

  /**
   * Opening a door by its handle and holding it: the hand reaches the handle,
   * closes on it and goes with it while the leaf swings, the person standing,
   * and walking round with the leaf when the arm alone would lose the handle.
   * Register `HumanTravelLeaf.openDoor` to use it.
   *
   * The leaf's swing is the scene's: the door is a prop whose handle moves
   * within it (`IHumanProp.point`, as `HumanObject.prop` gives an archetype's
   * articulated contact), and the hand follows the handle at every instant. The
   * hand turns to the handle's frame and closes on the door's own colliders
   * (`HumanMountRider.hold`, `HumanMountRider.closed`), reaching it over `TAKE`
   * seconds on the minimum-jerk profile (Flash and Hogan 1985). The arm is laid
   * as one course over that goal (`courseArmGoal`), so it keeps one branch
   * while the leaf swings. A handle the standing arm does not reach as the hand
   * takes it, such as a car door's below the shoulder, is taken leaning toward
   * it, the body lowered as a pick up lowers it. While the arm's own fit keeps
   * the wrist within `HOLD` of the hold from where the person stands the feet
   * stay there; otherwise the person walks with the leaf, backward and round
   * it, facing it, keeping the place relative to it the handle was taken from,
   * at the handle's pace (`HumanTravelLeafWalk`). A swing the hand still loses,
   * faster or farther than the person can walk with it, is refused as a `reach`
   * refusal on `handle` naming the largest swing followed. First pass: the
   * closure is the one at the instant the hand arrives.
   */
  export import travelLeaf = HumanTravelLeafLaw;

  /**
   * Riding: a seated person carried by a support that moves by itself, such as
   * a car, a bicycle or a horse given to the performance as a moving prop
   * (`HumanObject.prop` with a motion).
   *
   * The rider sits down on the support first (`sit` on its seat where it stands
   * at that second; `HumanObject.seat` reads a saddle with its pedals or
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
  export import rideVehicle = HumanRideLaw;

  /**
   * Board a moving carrier's seat (`IAutoMovieMotionHumanBoard`): in the seat
   * contact's moving frame the root travels from where it takes off to its
   * seated place on the seat by a minimum-jerk share, so it leaves and lands
   * with the seat's own velocity, rising `height` over the straight way on a
   * parabola of the share; the shape blends from the entry into an upright
   * astride seat with the legs hanging (`hangMountedLeg`), a held hand keeping
   * its hold until `LET_GO` of the flight. A hand holding a partner's thigh
   * that the flight carries behind the partner's back hands the hold over: the
   * other hand takes the partner's waist on its own side before the first lets
   * go, as its arm would come through the partner's trunk, so a hand holds the
   * partner throughout (`HumanBoardHandover`). Register `HumanBoard` to use
   * it.
   */
  export const board: typeof HumanBoardLaw = HumanBoardLaw;

  /**
   * One single-handed or bilateral handrim engagement over a seated ride.
   * Register the law and give the chair a circumferential contact reader, such
   * as `wheelchairHandrimFrame`. The hands approach, follow the rotating rim
   * points until release, and recover outward to the carried seated pose. Wheel
   * travel is supplied by the authored course.
   *
   * The contact and recovery phases follow the arcing path documented in Slowik
   * et al. (2015), Figure 1 and Table 1,
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1 . The recovery
   * clearance is a staging dimension of one rider hand length. The wrist enters
   * and leaves at the rim's tangential rate, estimated from the material point
   * inside the grip window, then blends to the seated pose. The law checks seat
   * alignment, active wheel sides and solved wrists at nine points through the
   * push before publishing contact windows. Chénier et al. (2022),
   * https://pubmed.ncbi.nlm.nih.gov/34915435/, also measured asymmetric
   * propulsion during wheelchair basketball dribbles.
   *
   * The three phases last the author's `approach`, `push` and `recovery`
   * seconds; no natural value is defined (provisional: no wheelchair-propulsion
   * timing study was read); pushing a manual wheelchair.
   */
  export const handrimStroke: typeof HumanHandrimStrokeLaw =
    HumanHandrimStrokeLaw;

  /**
   * Rise from the saddle while both feet follow their pedals and both hands
   * follow the handlebar. The seated ride provides the moving contact targets.
   * A smooth rise into and out of the authored clearance moves the pelvis up
   * and forward, and the ankle is refit about its pedal point under the new
   * hip. The entry seat and each sole's ball must already align with their
   * named supports. The law uses the distinct body/support states described by
   * the in-field seated and standing sprint study
   * https://www.mdpi.com/1424-8220/24/11/3453 . Its clearance, timing and
   * fore-aft transfer are staging decisions.
   */
  export const bicycleEffort: typeof HumanBicycleEffortLaw =
    HumanBicycleEffortLaw;

  /**
   * Wheel a bicycle by hand beside it, as a triathlete does through the
   * transition lane. The scene's course rolls the bicycle, with any stop it
   * makes; the athlete keeps the entered place beside it, so the root follows
   * the bicycle's frame, and the near hand holds that side's handlebar grip on
   * the posed bicycle. The path is stepped run by run between the bicycle's
   * stops, each run closed with the feet together. Steps are laid along the
   * root's path: a normal walking step of 0.41 stature, lengthened to keep a
   * running cadence where the bicycle is faster at the step's start, then a
   * closing step that brings the feet together where the bicycle stops. A foot
   * lands when the root has come half a step short of its print and swings for
   * at most the swing time before that, after the other foot has landed, so a
   * foot stays planted while the bicycle pauses. The pelvis lowers only as far
   * as the longer leg needs to reach its foot.
   *
   * Events: `take` when the hand closes on the grip, `step{k}` at each landing
   * and `release` at the end.
   */
  export const bikeGuide: typeof HumanBikeGuideLaw = HumanBikeGuideLaw;

  /**
   * Enter or leave the same stopped bicycle at a race boundary, using the
   * high-seat transfer and its displayed floor contacts. World Triathlon
   * Competition Rules §7.1(h,j) require a complete ground foot contact past the
   * mount line and short of the dismount line. This law checks the sole
   * geometry against a plane in the course frame and emits that event. See
   * https://www.triathlonmanitoba.ca/wp-content/uploads/World-Triathlon_Competition-Rules_20260429.pdf
   * .
   *
   * The scenic bicycle is authored independently while stopped or wheeled. Rack
   * and helmet choreography are separate equipment actions.
   */
  export const bikeTransfer: typeof HumanBikeTransferLaw = HumanBikeTransferLaw;

  /**
   * An opt-in law for one coast inside a stationary spacecraft. NASA-STD-3001
   * Volume 2 sections 8.5.2 and 8.5.5 describe handholds as starting and
   * stopping aids in microgravity
   * (https://www.nasa.gov/reference/8-0-architecture-vol-2/). The law stages
   * one hand delivering the departure impulse and the same hand absorbing the
   * stop. An author supplies the two contact durations and the grip's midpoint
   * clearance, with the body already staged by the first rail and a clear
   * corridor between the two. The kinematic staging assumes zero apparent
   * gravity and a stationary, upright entry. Full-body clearance, contact
   * forces and transitions into or out of the clip require separate staging.
   */
  export const spacecraftGlide: typeof spacecraftGlideLaw = spacecraftGlideLaw;

  /**
   * Surface travel under the performer. The ice and snow laws own their paths.
   * A board ride reads an animated prop and keeps the entered stance on it.
   * Upper-body overlays can work during any of the three actions.
   */
  export import HumanSurface = HumanSurfaceSource;
}
