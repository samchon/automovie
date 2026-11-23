import { support as supportLaw } from "../actions/support";
import { HumanSupportCarry as HumanSupportCarryLaw } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame as HumanSupportFrameLaw } from "../carrier/HumanSupportFrame";
import { supportTransfer as supportTransferLaw } from "../carrier/supportTransfer";
import { HumanSupportRows as HumanSupportRowsLaw } from "../lexicon/HumanSupportRows";
import { HUMAN_SUPPORT_SCRAMBLE } from "./presets/HUMAN_SUPPORT_SCRAMBLE";
import { HUMAN_SUPPORT_SLIDE_OFF } from "./presets/HUMAN_SUPPORT_SLIDE_OFF";

/**
 * A body support: a hand or foot taking the body's weight on a place.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `support`: Moving the body's weight across a sequence of supports: each
 *   stance's contacts (`HumanSupport.IStance`) solved into one static key
 *   posture, and the body carried from key to key with every new contact placed
 *   and bearing before any contact the next stance lacks lets go.
 * - `supportTransfer`: Plan one staged, level boarding transfer.
 * - `carry`: The one owner of goals in a moving support's frame: a posture
 *   planned in the world at an action's start, expressed in the support's frame
 *   there and carried back to the world at every second by the support's rigid
 *   motion since then.
 * - `frame`: The one reader of the frame a body's base rests on: the ground, a
 *   prop it sits or stands on (a saddle, a cart's bed, a deck), or a
 *   performer's region it is borne on, with that frame's velocity and
 *   acceleration at a second.
 * - `rows`: Movements over a surface as rows of the support planner (`support`):
 *   each a list of stances, the composition giving the surface (`on`), so a
 *   movement across several supports is data over the one planner that fits the
 *   body, refuses and is checked.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `SCRAMBLE`: The scramble preset: up onto a ledge in four stances, the palms
 *   on its top half a forearm and hand's length in from the edge, a knee up
 *   onto the edge, the other foot up beside it while the hands still bear, then
 *   standing.
 * - `SLIDE_OFF`: The slide-off preset: seated upright on a table's edge with the
 *   seat and the hands beside it half a forearm and hand's length back from the
 *   edge, the feet down to the floor, standing.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSupport} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSupport {
  /**
   * Moving the body's weight across a sequence of supports: each stance's
   * contacts (`HumanSupport.IStance`) solved into one static key posture, and
   * the body carried from key to key with every new contact placed and bearing
   * before any contact the next stance lacks lets go.
   *
   * A key posture is the static multi-contact posture nearest the posture the
   * body enters with that puts every contact on its target and keeps every
   * joint in its range (HumanBodyFit, Bouyarmane and Kheddar 2010, Escande et
   * al. 2013). An explicit positive balance request uses the fitted world
   * contacts and the selected part on the prepared clock. Each new key is
   * solved from the key before it, as a planner grows its next stance from its
   * parent. Between two stances the planner solves a third key on the union of
   * both stances' contacts, so the new contacts bear before the old ones
   * release (Escande et al.'s transition configurations, in both stances at
   * once), except a part the stance lets go free (`IStance.free`), which bears
   * no more from the stance's start and hangs as the posture carries it; the
   * body moves between keys on a minimum-jerk course in joint space (Flash and
   * Hogan 1985), each joint on its own range (`blendHumanJoint`). A part that
   * bears in two stances in a row on different targets steps: the planner first
   * solves a key without its old contact, the part over the middle of its step
   * lifted a stepping limb's rise (`crawl.LIFT`) clear of the higher end and
   * bearing on nothing, then the transition key with it set down, so a contact
   * is broken before it is made again; a foot stepping across the floor lifts
   * over its old place and lowers from over its new one instead, so it never
   * travels within the floor band (`supportStep`). Along the joint-space course
   * the root keeps the first common contact on its point, and every held hand
   * and foot is then fitted by its own two-bone chain to where the two keys
   * hold it (`prepareSupportInterval`); a held knee or trunk contact rides the
   * root pin and the floor bound alone. A staged route may add a course
   * (`supportCourse`): a stepping foot then passes the course's world waypoints
   * over a fixture edge, one lift key per waypoint and a straight toe course
   * between them, and a foot the course names as level bears flat with its heel
   * level at every key and through every interval that holds it. A contact no
   * key posture reaches is refused with the contact, its stance and the miss.
   *
   * A bearing foot lies on the floor at its toes' joint with its toes flat; a
   * bearing hand lies on its palm laid flat on the surface; on the floor a knee
   * bears on its shin and the trunk on its colliders, resting on their lowest
   * points, and on a raised surface each lays its own skin flat on it (the
   * knee, the seat, the upper back or the abdomen); a contact held across
   * stances without a place stays where it was first laid; a gripping hand
   * closes on its target at its grip. Each move takes `SECONDS` (provisional:
   * no study of the timing of a general support sequence was located) or its
   * stance's own, a step's third of it each to lift, to set down and to settle.
   * Events: `lift<i>` when the move into stance `i` has its stepping parts at
   * the top of their swing, `bear<i>` when it has placed its new contacts,
   * `stance<i>` (or the stance's own event) when stance `i` is held alone. The
   * plan lets overlays move the head and any arm and hand that have no contact
   * window in the sequence.
   */
  export import support = supportLaw;

  /**
   * Plan one staged, level boarding transfer. LA Metro asks passengers to wait
   * for a complete stop before boarding
   * (https://www.metro.net/riding/how-to-ride-metro-rail/). Stationary docking
   * is the default. The co-moving mode stages a scenic gangway whose platforms
   * share upright rigid motion through trailing touchdown. Both soles and the
   * root ride the deck after that touchdown. The dock check samples at
   * intervals of at most 1/120 s, with 1 mm and 0.1 degree tolerances on
   * stationary prop frames or, in co-moving mode, relative deck alignment at
   * its centre and corners.
   *
   * The lead sole lands while the trail sole bears on the platform. The deck
   * and platform must be level within 2 mm. Provisional staging limits are a
   * 0.13 m projected gap, 0.45 hip heights of ankle travel and a 65 mm lift.
   * Articulated surfaces, unsampled track excursions and obstacles between the
   * supports require a broader law.
   *
   * @param context A standing entry and the declared prop readers on the film
   *   clock.
   * @returns One posture plan with four foot contact windows.
   * @throws {HumanRefusal} When the entry, surfaces, docking or short-step
   *   bounds do not admit a transfer.
   */
  export const supportTransfer: typeof supportTransferLaw = supportTransferLaw;

  /**
   * The one owner of goals in a moving support's frame: a posture planned in
   * the world at an action's start, expressed in the support's frame there and
   * carried back to the world at every second by the support's rigid motion
   * since then. A stance on a cart's bed, a bow held on its target from a
   * cantering horse and a carbine presented from a moving car all plan once at
   * their start and are carried this way, so a goal on the support stays on it
   * and the plan stays a pure function of its seconds.
   *
   * The carry is the rigid transform `D(t) = F(t) F(start)^-1` of the support's
   * frame `F`: a point `p` goes to `F(t) F(start)^-1 p`, a rotation is turned
   * by the support's turn, and the heading by that turn's yaw about the
   * vertical. A goal attached to a bone (`HumanPosture.IGoal.on`) rides its
   * bone already and is left alone. On the ground the carry is the identity, so
   * nothing changes there.
   */
  export import carry = HumanSupportCarryLaw;

  /**
   * The one reader of the frame a body's base rests on: the ground, a prop it
   * sits or stands on (a saddle, a cart's bed, a deck), or a performer's region
   * it is borne on, with that frame's velocity and acceleration at a second.
   * Every consumer reads it here: a presented weapon aimed in the support's
   * frame, a launch inheriting the support's velocity, the rider's inertial
   * load, a borne person.
   *
   * The support is the bearing contact the action is entered on
   * (`IHumanEntryState.supports`): the seat or the feet, not a gripping hand,
   * the first one on a prop or a person, the ground when every one is on the
   * ground. The velocity and the acceleration are the central differences of
   * the support's origin at the engine's plan-time step
   * (`integrateMotionTrajectory.STEP`). A performer's region is read only at
   * and before the second evaluated (contract), so its differences are backward
   * ones over the same step.
   */
  export import frame = HumanSupportFrameLaw;

  /**
   * Movements over a surface as rows of the support planner (`support`): each a
   * list of stances, the composition giving the surface (`on`), so a movement
   * across several supports is data over the one planner that fits the body,
   * refuses and is checked. The stances follow the movements as coaching and
   * parkour practice describe them (a vault over a box flies from its hands to
   * its feet, which no support sequence holds, so it is a law of its own):
   *
   * - A scramble onto a ledge, its supports moved in stages: the palms laid flat
   *   on the top half a forearm and hand's length in from the edge, one knee
   *   brought up onto the edge, the other foot set on the top beside it while
   *   the hands still bear, then standing up on the top, the knee's foot
   *   stepping up beside the other;
   * - A slide off a table's edge: seated upright on it with the seat and the
   *   hands beside it half a forearm and hand's length back from the edge (the
   *   table behind the body), the feet down to the floor, standing. No timing
   *   study was read, so each move takes the planner's provisional time, and
   *   the insets are provisional. The standing posture is the floor laws' own
   *   key (`getUp.POSES`), the seated one the seated reference posture.
   */
  export import rows = HumanSupportRowsLaw;

  /**
   * The scramble preset: up onto a ledge in four stances, the palms on its top
   * half a forearm and hand's length in from the edge, a knee up onto the edge,
   * the other foot up beside it while the hands still bear, then standing. Each
   * stance takes the planner's `SECONDS`, 1 s, so about 4 s (provisional: no
   * timing study). Passed as `support`'s `stances`; the `scramble` row of
   * `HumanSupportRows` reads it.
   */
  export const SCRAMBLE: typeof HUMAN_SUPPORT_SCRAMBLE = HUMAN_SUPPORT_SCRAMBLE;

  /**
   * The slide-off preset: seated upright on a table's edge with the seat and
   * the hands beside it half a forearm and hand's length back from the edge,
   * the feet down to the floor, standing. Each of its 3 stances takes the
   * planner's `SECONDS`, 1 s, so about 3 s (provisional: no timing study).
   * Passed as `support`'s `stances`; the `slideOff` row of `HumanSupportRows`
   * reads it.
   */
  export const SLIDE_OFF: typeof HUMAN_SUPPORT_SLIDE_OFF =
    HUMAN_SUPPORT_SLIDE_OFF;
}
