import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPickUp,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { pickUpPosture } from "./pickUpPosture";
import { planPickUpGrasp } from "./planPickUpGrasp";

/**
 * Reaching for a prop's grip, grasping it and lifting it clear.
 *
 * The goal is the grip, not the arm: the hand's grip socket is brought onto
 * the prop's grip affordance along its approach axis (`HumanGrasp`), taken
 * as the archetype declares it: untilted, and from the side about the
 * grip's axis the arm reaches with the least wrist error among the sides
 * its declared symmetry allows (any side of a round grip, either of a
 * half-symmetric one, the declared one otherwise; `pickUpSearch.TURNS`);
 * a use's grasp is searched over its own turns and tilts. Then the
 * fingers open to the peak aperture on the way and close on the prop's
 * colliders until contact (`HumanGrip`), and inverse kinematics solves the
 * arm. Where the arm reaches the grip from the posture the action is
 * entered in, the rest of the body holds that posture, so a pick up
 * continues a stand or the deepest point of a bend with its feet planted,
 * and only the reaching arm and its fingers move. Where it does not, a
 * standing body is lowered toward the grip over the reach, as the bend law
 * lowers it (`pickUpPosture`): a slight lean at a counter, a stoop or a
 * squat for a low one, the feet planted; a seated one leans from its seat;
 * and where the arm still misses, the trunk turns toward the grip first
 * and a standing body then takes one adjustment step (`pickUpAdjust`).
 * The lift is the whole body's: the trunk or the stance carries what the
 * arm cannot, and where neither does, the step is taken for the grip and
 * the lifted place together (`pickUpStance`). A body that moved for the
 * grip or the lift straightens after it over as long as the reach, the
 * hand riding with the shoulder, and the event `upright` closes the
 * action.
 *
 * Phases:
 *
 * 1. Reach: the reach-to-grasp transport (`HumanPrehension`): the
 *    two-factor movement time of McIntosh et al. (2018) for the wrist's travel
 *    and the grasped width, with the performer's timing variability; the
 *    hand comes in the last stretch along the approach axis from a setback
 *    equal to the peak aperture, so the open hand clears the object, and the
 *    aperture peaks inside Jeannerod's 60 to 70 % band.
 * 2. Load: the hand holds for 0.15 s with the fingers closed, the
 *    preload and load phases that precede lift-off in a precision lift
 *    (Johansson and Westling 1984, Exp. Brain Res. 56:550); the duration is
 *    provisional, as the phase durations themselves were not reached.
 * 3. Lift: the wrist rises `lift` metres (0.1 m when absent, provisional:
 *    about a hand's breadth clear of the support, or 0 when the other hand
 *    already holds it) on a minimum-jerk profile
 *    timed by the same movement-time law. Where the arm alone cannot bring
 *    the wrist to its lifted place, the trunk inclines toward it, or a
 *    lowered body straightens part of the way, over the lift
 *    (`pickUpLift.raise`); a lift the planned hand still falls short of by
 *    more than the arm solver's place tolerance is refused on `lift`
 *    (`pickUpLift.judged`).
 *
 * The hand grips the prop from `gripClosed` to the end, which attaches the
 * prop to the hand (`HumanPerformance.prop`), so the prop rides the lift, and
 * the plan declares a hold from `gripClosed`, so the hand keeps the prop with
 * its closed fingers through later actions (carried with the trunk while a
 * walk or a turn drives the body) until a put down or a hand over takes it.
 * A second hand steadies a prop the other already carries; it takes the grip
 * without a lift, and an independently requested lift is refused on `lift`.
 *
 * Events: `gripClosed`, `liftOff`, `lifted`, and `upright` after a body
 * lowered for the grip or inclined for the lift straightens. A pick up cut
 * into a stand before `gripClosed` abandons the reach; after `lifted` it continues into a stand, a walk, a put down or
 * a hand over. A grip no lowering brings within the arm, or one beyond the
 * arm of a body that is not standing, is refused with the step named.
 */
export namespace pickUp {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "pickUp";

  /** May be performed over a carrier, as a seated rider takes a revolver from its holster: it then claims only the reaching arm and its hand (`pickUpOver`). */
  export const overlay: boolean = true;

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: [0, "gripClosed"],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
        keep: ["grip"],
      },
    ],
    walk: [
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
        keep: ["grip"],
      },
    ],
  };

  /** The share of the reach over which the arm leaves its entry pose by a blend of its joints, before the transport's goal alone leads it to the grip (provisional: 0.6, ahead of the last stretch the hand makes along the approach). */
  export const LEAVE: number = 0.6;

  /** The load phase between contact and lift-off, seconds; provisional. */
  export const LOAD: number = 0.15;

  /**
   * Plan a pick up.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no lowering brings the grip within reach, no grasp serves the use, the hand cannot rise as far as the lift asks, or a second hand asks to lift independently of the hand already carrying the prop.
   * @throws {Error} When the lift is negative, or the prop has no such affordance or no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The law and parameters define original grasp/use/lift/steadied-hand goals, contact events, variation and refusals; this plan preserves complete position/attitude requests through the actual lift.
   * @evidence contracts/development/implementation.md#principled-implementation Existing stance/grasp/prehension owners choose and transport the grip, close its actual contacts, carry the original complete arm/digit/reference goals and apply the original lift-height judgement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Grasp/stance admission precedes finger/transport preparation, original phase body construction and complete arm goals; optional same-person observations follow those existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original grasp/lift targets, contact timing, candidate fits, ROM, reference, planting and acceptance bounds remain; no shown endpoint replaces an asked goal and no attitude-only post-fit twist discards position.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed target/hand/digit/transport data prepare once. Active body lowering, shoulder reading and initial carry borrow exact current-person FK/ROM where supplied; every original phase goal and actual solve remains. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One arm course serves the reach, the load and the lift, so the load shows the course's own hold rather than a posture frozen at the close. The moving phases use current-call FK and ROM loans through their original stance, lift and carry paths.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns original chosen grasp/stance/transport/finger geometry; current FK/ROM arguments are used synchronously and never stored in the plan, returned goals or query history.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return planPickUpGrasp(context);
  }

  /**
   * The grasp plan with an optional resolved interception (`planPickUpGrasp`),
   * kept on the law for the moving pick-up that supplies one.
   */
  export const planGrasp: typeof planPickUpGrasp = planPickUpGrasp;

  /** Whether a wrist goal lies within the straight arm's reach from its shoulder (`pickUpPosture.reaches`), which the put down reads too. */
  export const reaches: typeof pickUpPosture.reaches = pickUpPosture.reaches;

  /** Refuse a wrist goal beyond the straight arm's reach from its shoulder (`pickUpPosture.reachable`), which the put down reads too. */
  export const reachable: typeof pickUpPosture.reachable =
    pickUpPosture.reachable;
}
