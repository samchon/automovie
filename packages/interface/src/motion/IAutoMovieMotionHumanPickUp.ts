import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanGraspUse } from "./IAutoMovieMotionHumanGraspUse";

/**
 * Reaching for a prop's grip, grasping it and lifting it clear.
 *
 * The goal is the grip, not the arm: the hand's grip socket is brought onto the
 * prop's grip affordance along its approach axis (`HumanGrasp`), taken as the
 * archetype declares it: untilted, and from the side about the grip's axis the
 * arm reaches with the least wrist error among the sides its declared symmetry
 * allows (any side of a round grip, either of a half-symmetric one, the
 * declared one otherwise; `pickUpSearch.TURNS`); a use's grasp is searched over
 * its own turns and tilts. Then the fingers open to the peak aperture on the
 * way and close on the prop's colliders until contact (`HumanGrip`), and
 * inverse kinematics solves the arm. Where the arm reaches the grip from the
 * posture the action is entered in, the rest of the body holds that posture, so
 * a pick up continues a stand or the deepest point of a bend with its feet
 * planted, and only the reaching arm and its fingers move. Where it does not, a
 * standing body is lowered toward the grip over the reach, as the bend law
 * lowers it (`pickUpPosture`): a slight lean at a counter, a stoop or a squat
 * for a low one, the feet planted; a seated one leans from its seat; and where
 * the arm still misses, the trunk turns toward the grip first and a standing
 * body then takes one adjustment step (`pickUpAdjust`). The lift is the whole
 * body's: the trunk or the stance carries what the arm cannot, and where
 * neither does, the step is taken for the grip and the lifted place together
 * (`pickUpStance`). A body that moved for the grip or the lift straightens
 * after it over as long as the reach, the hand riding with the shoulder, and
 * the event `upright` closes the action.
 *
 * Phases:
 *
 * 1. Reach: the reach-to-grasp transport (`HumanPrehension`): the two-factor
 *    movement time of McIntosh et al. (2018) for the wrist's travel and the
 *    grasped width, with the performer's timing variability; the hand comes in
 *    the last stretch along the approach axis from a setback equal to the peak
 *    aperture, so the open hand clears the object, and the aperture peaks
 *    inside Jeannerod's 60 to 70 % band. The time is `-0.31 + 0.30 log10(reach
 *    in mm) + 0.00065 (width in mm)` seconds (`HumanPrehension.nominal`; never
 *    under its value at 170 mm, 0.40 s for a 6 cm width): about 0.5 s for a 0.4
 *    m reach to a 6 cm grip and 0.56 s for 0.6 m. This is the family's model
 *    for `pickUp`, `putDown` and every other reach to a place.
 * 2. Load: the hand holds still for 0.15 s with the fingers closed, the preload
 *    and load phases that precede lift-off in a precision lift (Johansson and
 *    Westling 1984, Exp. Brain Res. 56:550); the duration is provisional, as
 *    the phase durations themselves were not reached.
 * 3. Lift: the wrist rises `lift` metres (0.1 m when absent, provisional: about a
 *    hand's breadth clear of the support, or 0 when the other hand already
 *    holds it) on a minimum-jerk profile timed by the same movement-time law.
 *    Where the arm alone cannot bring the wrist to its lifted place, the trunk
 *    inclines toward it, or a lowered body straightens part of the way, over
 *    the lift (`pickUpLift.raise`); a lift the planned hand still falls short
 *    of by more than the arm solver's place tolerance is refused on `lift`
 *    (`pickUpLift.judged`).
 *
 * The hand grips the prop from `gripClosed` to the end, which attaches the prop
 * to the hand (`AutoMovieMotionHumanPerformance.prop`), so the prop rides the lift, and the
 * plan declares a hold from `gripClosed`, so the hand keeps the prop with its
 * closed fingers through later actions (carried with the trunk while a walk or
 * a turn drives the body) until a put down or a hand over takes it. A second
 * hand steadies a prop the other already carries; it takes the grip without a
 * lift, and an independently requested lift is refused on `lift`.
 *
 * Events: `gripClosed`, `liftOff`, `lifted`, and `upright` after a body lowered
 * for the grip or inclined for the lift straightens. A pick up cut into a stand
 * before `gripClosed` abandons the reach; after `lifted` it continues into a
 * stand, a walk, a put down or a hand over. A grip no lowering brings within
 * the arm, or one beyond the arm of a body that is not standing, is refused
 * with the step named.
 */
export namespace IAutoMovieMotionHumanPickUp {
  /**
   * A place along a grip's band: the share of the band's length from its end
   * against the grip's wrapped axis (0) to its end along it (1), the middle
   * 0.5, so a long bar is taken where the act needs it (a vaulter's top hand on
   * the shaft).
   */
  export type Along = number;

  /** Parameters. */
  export interface IParams {
    /** The prop's subject id. */
    prop: string;

    /** The grip affordance's id. */
    handle: string;

    /**
     * Where along the grip's band the hand takes it
     * (`IAutoMovieMotionHumanPickUp.Along`); the band's middle when absent.
     */
    along?: IAutoMovieMotionHumanPickUp.Along;

    /** The grasping hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * How far the wrist rises after the grasp, metres; 0 when the other hand
     * already holds the prop, otherwise 0.1 when absent. A steadying hand
     * cannot lift independently.
     */
    lift?: number;

    /**
     * What the prop is taken up for, when it is a tool: the grasp is then
     * chosen for the use and not only for the reach. A handle can be wrapped
     * from any side, and the side the hanging arm reaches most easily leaves a
     * blade or a barrel where the wrist cannot later aim it. With a use, the
     * grasp must also hold with the tool presented ahead of the shoulder on the
     * line the use names, and a handle no grasp serves so is refused. Absent,
     * the grasp is chosen for the reach and the lift alone.
     */
    use?: IAutoMovieMotionHumanGraspUse.IUse;
  }
}
