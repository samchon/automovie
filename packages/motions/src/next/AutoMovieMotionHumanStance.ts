import { AutoMovieMotionHumanStanceLaws } from "./AutoMovieMotionHumanStanceLaws";
import { AutoMovieMotionHumanStanceRows } from "./AutoMovieMotionHumanStanceRows";

/**
 * The standing postures: quiet standing, shifting weight, bending, crouching,
 * bracing, resting and curtsying.
 *
 * A planted posture computes no balance. A named rest or hold that fixes
 * parameter values is a preset, data spread into the law's parameters beside
 * the hold: `AutoMovieMotionHumanStance.ARMS_CROSSED`, `HANDS_ON_HIPS`,
 * `HANDS_IN_POCKETS`, `PARADE_REST`, `HANDS_CLASPED`, `HANDS_BEHIND_HEAD` and
 * `THINKING`, `REST_SIDE`, `CHIN_REST` and `ELBOW_SUPPORT` (`IRestPreset`),
 * `SQUAT_SIT` and `TAKE_COVER` (`ICrouchPreset`) and `MOUNTAIN_POSE`
 * (`IStandPreset`); a preset adds no method.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `stand`: Quiet standing: both feet planted where they are (or under the hips
 *   when entered from the air), the pelvis settling over them, the column
 *   upright on the plumb line and inclined slightly forward at the ankles
 *   ({@link standUpright}), arms hanging relaxed, and the body swaying
 *   slightly.
 * - `shift`: Shifting along a bench while seated: the seat socket slides sideways
 *   along the seat by the requested distance, while the feet stay planted and
 *   the hands stay on the thighs.
 * - `bend`: Bending down to bring a hand to a low point (the floor, a low shelf,
 *   a note on the ground) with the feet planted, by a stoop, a squat or a
 *   semi-squat, then straightening up.
 * - `crouch`: A crouch or a squat held in place: the hips sink over the planted
 *   feet to a knee flexion the depth names, the trunk inclines over the feet,
 *   the hands come to rest on the thighs above the knees, the body holds, then
 *   stands again.
 * - `brace`: Bracing for an expected impact, push or a falling body: the stance
 *   widens and staggers along the line of the coming force, the body lowers and
 *   leans into it, and the hands come up in front, all set before the force
 *   arrives.
 * - `rest`: Standing with the hands at rest places: in the front pockets, on the
 *   hips, arms crossed, clasped in front or behind, behind the head, or the
 *   chin on a fist, each hand moved there and held.
 * - `curtsy`: A small ceremonial curtsy.
 * - `standUpright`: The upright alignment of a body's quiet stance, solved from
 *   the body's own joints by forward kinematics, once per body.
 * - `shiftStandingWeight`: An intentional lateral pelvis shift with both feet
 *   planted on the ground.
 * - `braceOnThigh`: A palm carried from the angles the arm held onto its own
 *   thigh just above the knee (`braceOnThighPoint`), the hand support of a low
 *   posture, read on the legs the action has placed.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `ARMS_CROSSED`: The armsCrossed preset of `rest`: Arms crossed on the chest:
 *   each hand on the front of the other upper arm.
 * - `HANDS_ON_HIPS`: The handsOnHips preset of `rest`: Hands on the hips: each
 *   palm on the side of its own pelvis, the elbows out.
 * - `HANDS_IN_POCKETS`: The handsInPockets preset of `rest`: Hands in the
 *   pockets: each palm on the front pocket region of its own thigh.
 * - `PARADE_REST`: The paradeRest preset of `rest`: Parade rest: the hands
 *   clasped behind the back, on the sacrum.
 * - `HANDS_CLASPED`: The handsClasped preset of `rest`: The hands clasped in
 *   front of the pelvis.
 * - `HANDS_BEHIND_HEAD`: The handsBehindHead preset of `rest`: The hands behind
 *   the head, the elbows wide.
 * - `THINKING`: The thinking preset of `rest`: The thinker: the left hand
 *   supporting the other elbow, the right fist under the chin.
 * - `MOUNTAIN_POSE`: The mountain pose preset of `stand`: standing still for ten
 *   seconds, the yoga pose held.
 * - `SQUAT_SIT`: The squatSit preset of `crouch`: Squatting fully, the heels up,
 *   and holding three seconds (provisional).
 * - `TAKE_COVER`: The takeCover preset of `crouch`: Crouching and holding two
 *   seconds (provisional).
 * - `REST_SIDE`: The restSide preset of `rest`: Both hands at the sides: the arms
 *   hang.
 * - `CHIN_REST`: The restChinRest preset of `rest`: Both hands at the chin rest.
 * - `ELBOW_SUPPORT`: The restElbowSupport preset of `rest`: Both hands at the
 *   elbow support.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanHabit`: Habits: the small things people do with their hands, each a row
 *   of a shipped action.
 * - `HumanStance`: Named ways of standing and what a body does by itself, each a
 *   row of `rest` or `selfAction`.
 * - `HumanPose`: Whole-body postures and reactions under film names, each a row
 *   of a shipped action.
 * - `HumanRestRows`: The rest places as rows: both hands of `rest` at one place
 *   under a name of its own, the time held left open; a production gives the
 *   two hands different places through `rest` itself.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanStance} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanStance {
  /** Quiet standing. See `AutoMovieMotionHumanStanceLaws.stand`. */
  export import stand = AutoMovieMotionHumanStanceLaws.stand;

  /**
   * Shifting along a bench while seated. See
   * `AutoMovieMotionHumanStanceLaws.shift`.
   */
  export import shift = AutoMovieMotionHumanStanceLaws.shift;

  /**
   * Bending down to bring a hand to a low point (the floor, a low shelf, a note
   * on the ground) with the feet planted, by a stoop, a squat or a semi-squat,
   * then straightening up. See `AutoMovieMotionHumanStanceLaws.bend`.
   */
  export import bend = AutoMovieMotionHumanStanceLaws.bend;

  /**
   * A crouch or a squat held in place. See
   * `AutoMovieMotionHumanStanceLaws.crouch`.
   */
  export import crouch = AutoMovieMotionHumanStanceLaws.crouch;

  /**
   * Bracing for an expected impact, push or a falling body. See
   * `AutoMovieMotionHumanStanceLaws.brace`.
   */
  export import brace = AutoMovieMotionHumanStanceLaws.brace;

  /**
   * Standing with the hands at rest places. See
   * `AutoMovieMotionHumanStanceLaws.rest`.
   */
  export import rest = AutoMovieMotionHumanStanceLaws.rest;

  /** A small ceremonial curtsy. See `AutoMovieMotionHumanStanceLaws.curtsy`. */
  export import curtsy = AutoMovieMotionHumanStanceLaws.curtsy;

  /**
   * The armsCrossed preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.ARMS_CROSSED`.
   */
  export import ARMS_CROSSED = AutoMovieMotionHumanStanceRows.ARMS_CROSSED;

  /**
   * The handsOnHips preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.HANDS_ON_HIPS`.
   */
  export import HANDS_ON_HIPS = AutoMovieMotionHumanStanceRows.HANDS_ON_HIPS;

  /**
   * The handsInPockets preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.HANDS_IN_POCKETS`.
   */
  export import HANDS_IN_POCKETS = AutoMovieMotionHumanStanceRows.HANDS_IN_POCKETS;

  /**
   * The paradeRest preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.PARADE_REST`.
   */
  export import PARADE_REST = AutoMovieMotionHumanStanceRows.PARADE_REST;

  /**
   * The handsClasped preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.HANDS_CLASPED`.
   */
  export import HANDS_CLASPED = AutoMovieMotionHumanStanceRows.HANDS_CLASPED;

  /**
   * The handsBehindHead preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.HANDS_BEHIND_HEAD`.
   */
  export import HANDS_BEHIND_HEAD = AutoMovieMotionHumanStanceRows.HANDS_BEHIND_HEAD;

  /**
   * The thinking preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.THINKING`.
   */
  export import THINKING = AutoMovieMotionHumanStanceRows.THINKING;

  /**
   * The mountain pose preset of `stand`. See
   * `AutoMovieMotionHumanStanceRows.MOUNTAIN_POSE`.
   */
  export import MOUNTAIN_POSE = AutoMovieMotionHumanStanceRows.MOUNTAIN_POSE;

  /**
   * The upright alignment of a body's quiet stance, solved from the body's own
   * joints by forward kinematics, once per body. See
   * `AutoMovieMotionHumanStanceLaws.standUpright`.
   */
  export import standUpright = AutoMovieMotionHumanStanceLaws.standUpright;

  /**
   * An intentional lateral pelvis shift with both feet planted on the ground.
   * See `AutoMovieMotionHumanStanceLaws.shiftStandingWeight`.
   */
  export import shiftStandingWeight = AutoMovieMotionHumanStanceLaws.shiftStandingWeight;

  /**
   * A palm carried from the angles the arm held onto its own thigh just above
   * the knee (`braceOnThighPoint`), the hand support of a low posture, read on
   * the legs the action has placed. See
   * `AutoMovieMotionHumanStanceLaws.braceOnThigh`.
   */
  export import braceOnThigh = AutoMovieMotionHumanStanceLaws.braceOnThigh;

  /** Habits. See `AutoMovieMotionHumanStanceRows.HumanHabit`. */
  export import HumanHabit = AutoMovieMotionHumanStanceRows.HumanHabit;

  /**
   * Named ways of standing and what a body does by itself, each a row of `rest`
   * or `selfAction`. See `AutoMovieMotionHumanStanceRows.HumanStance`.
   */
  export import HumanStance = AutoMovieMotionHumanStanceRows.HumanStance;

  /**
   * Whole-body postures and reactions under film names, each a row of a shipped
   * action. See `AutoMovieMotionHumanStanceRows.HumanPose`.
   */
  export import HumanPose = AutoMovieMotionHumanStanceRows.HumanPose;

  /**
   * The rest places as rows. See
   * `AutoMovieMotionHumanStanceRows.HumanRestRows`.
   */
  export import HumanRestRows = AutoMovieMotionHumanStanceRows.HumanRestRows;

  /**
   * The squatSit preset of `crouch`. See
   * `AutoMovieMotionHumanStanceRows.SQUAT_SIT`.
   */
  export import SQUAT_SIT = AutoMovieMotionHumanStanceRows.SQUAT_SIT;

  /**
   * The takeCover preset of `crouch`. See
   * `AutoMovieMotionHumanStanceRows.TAKE_COVER`.
   */
  export import TAKE_COVER = AutoMovieMotionHumanStanceRows.TAKE_COVER;

  /**
   * The restSide preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.REST_SIDE`.
   */
  export import REST_SIDE = AutoMovieMotionHumanStanceRows.REST_SIDE;

  /**
   * The restChinRest preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.CHIN_REST`.
   */
  export import CHIN_REST = AutoMovieMotionHumanStanceRows.CHIN_REST;

  /**
   * The restElbowSupport preset of `rest`. See
   * `AutoMovieMotionHumanStanceRows.ELBOW_SUPPORT`.
   */
  export import ELBOW_SUPPORT = AutoMovieMotionHumanStanceRows.ELBOW_SUPPORT;
}
