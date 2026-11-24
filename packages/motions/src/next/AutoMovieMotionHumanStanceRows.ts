import { HumanHabit as HumanHabitSource } from "../lexicon/HumanHabit";
import { HumanPose as HumanPoseSource } from "../lexicon/HumanPose";
import { HumanRestRows as HumanRestRowsSource } from "../lexicon/HumanRestRows";
import { HumanStance as HumanStanceSource } from "../lexicon/HumanStance";
import { HUMAN_STANCE_ARMS_CROSSED } from "./presets/HUMAN_STANCE_ARMS_CROSSED";
import { HUMAN_STANCE_CHIN_REST } from "./presets/HUMAN_STANCE_CHIN_REST";
import { HUMAN_STANCE_ELBOW_SUPPORT } from "./presets/HUMAN_STANCE_ELBOW_SUPPORT";
import { HUMAN_STANCE_HANDS_BEHIND_HEAD } from "./presets/HUMAN_STANCE_HANDS_BEHIND_HEAD";
import { HUMAN_STANCE_HANDS_CLASPED } from "./presets/HUMAN_STANCE_HANDS_CLASPED";
import { HUMAN_STANCE_HANDS_IN_POCKETS } from "./presets/HUMAN_STANCE_HANDS_IN_POCKETS";
import { HUMAN_STANCE_HANDS_ON_HIPS } from "./presets/HUMAN_STANCE_HANDS_ON_HIPS";
import { HUMAN_STANCE_MOUNTAIN_POSE } from "./presets/HUMAN_STANCE_MOUNTAIN_POSE";
import { HUMAN_STANCE_PARADE_REST } from "./presets/HUMAN_STANCE_PARADE_REST";
import { HUMAN_STANCE_REST_SIDE } from "./presets/HUMAN_STANCE_REST_SIDE";
import { HUMAN_STANCE_SQUAT_SIT } from "./presets/HUMAN_STANCE_SQUAT_SIT";
import { HUMAN_STANCE_TAKE_COVER } from "./presets/HUMAN_STANCE_TAKE_COVER";
import { HUMAN_STANCE_THINKING } from "./presets/HUMAN_STANCE_THINKING";

/**
 * The stance family's presets and rows, each the shipped data under its family
 * name (`AutoMovieMotionHumanStance`), with its own comment.
 */
export namespace AutoMovieMotionHumanStanceRows {
  /**
   * The armsCrossed preset of `rest`: Arms crossed on the chest: each hand on
   * the front of the other upper arm. Spread into `rest`'s parameters with the
   * hold; the `armsCrossed` row of `HumanStance` fixes these places. Where each
   * place lies on the body and how a hand reaches it is stated on
   * `IAutoMovieMotionHumanRest`.
   */
  export const ARMS_CROSSED: typeof HUMAN_STANCE_ARMS_CROSSED =
    HUMAN_STANCE_ARMS_CROSSED;

  /**
   * The handsOnHips preset of `rest`: Hands on the hips: each palm on the side
   * of its own pelvis, the elbows out. Spread into `rest`'s parameters with the
   * hold; the `handsOnHips` row of `HumanStance` fixes these places. Where each
   * place lies on the body and how a hand reaches it is stated on
   * `IAutoMovieMotionHumanRest`.
   */
  export const HANDS_ON_HIPS: typeof HUMAN_STANCE_HANDS_ON_HIPS =
    HUMAN_STANCE_HANDS_ON_HIPS;

  /**
   * The handsInPockets preset of `rest`: Hands in the pockets: each palm on the
   * front pocket region of its own thigh. Spread into `rest`'s parameters with
   * the hold; the `handsInPockets` row of `HumanStance` fixes these places.
   * Where each place lies on the body and how a hand reaches it is stated on
   * `IAutoMovieMotionHumanRest`.
   */
  export const HANDS_IN_POCKETS: typeof HUMAN_STANCE_HANDS_IN_POCKETS =
    HUMAN_STANCE_HANDS_IN_POCKETS;

  /**
   * The paradeRest preset of `rest`: Parade rest: the hands clasped behind the
   * back, on the sacrum. Spread into `rest`'s parameters with the hold; the
   * `paradeRest` row of `HumanStance` fixes these places. Where each place lies
   * on the body and how a hand reaches it is stated on
   * `IAutoMovieMotionHumanRest`.
   */
  export const PARADE_REST: typeof HUMAN_STANCE_PARADE_REST =
    HUMAN_STANCE_PARADE_REST;

  /**
   * The handsClasped preset of `rest`: The hands clasped in front of the
   * pelvis. Spread into `rest`'s parameters with the hold; the `handsClasped`
   * row of `HumanStance` fixes these places. Where each place lies on the body
   * and how a hand reaches it is stated on `IAutoMovieMotionHumanRest`.
   */
  export const HANDS_CLASPED: typeof HUMAN_STANCE_HANDS_CLASPED =
    HUMAN_STANCE_HANDS_CLASPED;

  /**
   * The handsBehindHead preset of `rest`: The hands behind the head, the elbows
   * wide. Spread into `rest`'s parameters with the hold; the `handsBehindHead`
   * row of `HumanStance` fixes these places. Where each place lies on the body
   * and how a hand reaches it is stated on `IAutoMovieMotionHumanRest`.
   */
  export const HANDS_BEHIND_HEAD: typeof HUMAN_STANCE_HANDS_BEHIND_HEAD =
    HUMAN_STANCE_HANDS_BEHIND_HEAD;

  /**
   * The thinking preset of `rest`: The thinker: the left hand supporting the
   * other elbow, the right fist under the chin. Spread into `rest`'s parameters
   * with the hold; the `thinking` row of `HumanStance` fixes these places.
   * Where each place lies on the body and how a hand reaches it is stated on
   * `IAutoMovieMotionHumanRest`.
   */
  export const THINKING: typeof HUMAN_STANCE_THINKING = HUMAN_STANCE_THINKING;

  /**
   * The mountain pose preset of `stand`: standing still for ten seconds, the
   * yoga pose held. Spread into `stand`'s parameters; the `mountainPose` row of
   * `HumanSportWorkout` fixes this hold. The ten seconds are provisional until
   * a yoga source for the held mountain pose is read.
   */
  export const MOUNTAIN_POSE: typeof HUMAN_STANCE_MOUNTAIN_POSE =
    HUMAN_STANCE_MOUNTAIN_POSE;

  /**
   * Habits: the small things people do with their hands, each a row of a
   * shipped action. Register the ones a film uses.
   */
  export import HumanHabit = HumanHabitSource;

  /**
   * Named ways of standing and what a body does by itself, each a row of `rest`
   * or `selfAction`. Register the ones a film uses.
   */
  export import HumanStance = HumanStanceSource;

  /**
   * Whole-body postures and reactions under film names, each a row of a shipped
   * action. Register the ones a film uses.
   */
  export import HumanPose = HumanPoseSource;

  /**
   * The rest places as rows: both hands of `rest` at one place under a name of
   * its own, the time held left open; a production gives the two hands
   * different places through `rest` itself.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanRestRows = HumanRestRowsSource;

  /**
   * The squatSit preset of `crouch`: Squatting fully, the heels up, and holding
   * three seconds (provisional). Spread into `crouch`'s parameters; the
   * `squatSit` row reads it.
   */
  export const SQUAT_SIT: typeof HUMAN_STANCE_SQUAT_SIT =
    HUMAN_STANCE_SQUAT_SIT;

  /**
   * The takeCover preset of `crouch`: Crouching and holding two seconds
   * (provisional). Spread into `crouch`'s parameters; the `takeCover` row reads
   * it.
   */
  export const TAKE_COVER: typeof HUMAN_STANCE_TAKE_COVER =
    HUMAN_STANCE_TAKE_COVER;

  /**
   * The restSide preset of `rest`: Both hands at the sides: the arms hang.
   * Spread into `rest`'s parameters; the `restSide` row reads it.
   */
  export const REST_SIDE: typeof HUMAN_STANCE_REST_SIDE =
    HUMAN_STANCE_REST_SIDE;

  /**
   * The restChinRest preset of `rest`: Both hands at the chin rest. Spread into
   * `rest`'s parameters; the `restChinRest` row reads it.
   */
  export const CHIN_REST: typeof HUMAN_STANCE_CHIN_REST =
    HUMAN_STANCE_CHIN_REST;

  /**
   * The restElbowSupport preset of `rest`: Both hands at the elbow support.
   * Spread into `rest`'s parameters; the `restElbowSupport` row reads it.
   */
  export const ELBOW_SUPPORT: typeof HUMAN_STANCE_ELBOW_SUPPORT =
    HUMAN_STANCE_ELBOW_SUPPORT;
}
