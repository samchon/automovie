import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Devotional acts composed from shipped actions: the sign of the cross, a
 * genuflection and a kneeling prayer. Each appends shipped touch, kneel and
 * gesture actions to the performer's chain, so they are fitted, refused and
 * checked as those actions are.
 *
 * The sign of the cross touches the forehead, the sternum and both shoulders
 * with the fingertips, in that order; the Latin rite crosses the shoulders left
 * then right, the Byzantine rite right then left. A genuflection lowers the
 * right knee to the floor beside the left heel and rises at once (General
 * Instruction of the Roman Missal, no. 274), optionally signing the cross
 * first. A kneeling prayer kneels on both knees with the palms together before
 * the chest for the authored hold, then rises. The timings are the namespace
 * constants `TOUCH_HOLD`, `SITE` and `GENUFLECT_HOLD` of
 * `AutoMovieMotionHumanRitual` (provisional).
 *
 * Each method is a helper over a chain: it takes the chain first and returns it
 * with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain every method takes and returns.
 */


/** The parameter types of the Ritual methods. */
export namespace IAutoMovieMotionHumanRitual {
  /**
   * Which shoulder the sign of the cross touches first: the Latin rite's left
   * or the Byzantine rite's right.
   */
  export type IRite = "latin" | "byzantine";

  /** The self regions the sign of the cross touches. */
  export type ICrossRegion =
    | "forehead"
    | "sternum"
    | "shoulderLeft"
    | "shoulderRight";

  /** The parameters of `signOfCross`. */
  export interface ISignOfCross {
    /** The signing hand; the right when absent. */
    hand?: AutoMovieHumanSide;

    /** The shoulder order; the Latin rite when absent. */
    rite?: IRite;
  }

  /** The parameters of `genuflect`. */
  export interface IGenuflect {
    /** Whether to sign the cross before kneeling; `false` when absent. */
    cross?: boolean;
  }

  /** The parameters of `kneelingPrayer`. */
  export interface IKneelingPrayer {
    /** Seconds kneeling in prayer. */
    hold: number;
  }
}
