import { GENUFLECT_HOLD as GENUFLECT_HOLDSource } from "../ritual/internal/GENUFLECT_HOLD";
import { SITE as SITESource } from "../ritual/internal/SITE";
import { TOUCH_HOLD as TOUCH_HOLDSource } from "../ritual/internal/TOUCH_HOLD";
import { genuflect as genuflectLaw } from "../ritual/internal/genuflect";
import { kneelingPrayer as kneelingPrayerLaw } from "../ritual/internal/kneelingPrayer";
import { signOfCross as signOfCrossLaw } from "../ritual/internal/signOfCross";

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
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `signOfCross`: Append the sign of the cross: forehead, sternum, then both
 *   shoulders in the rite's order, with one hand's fingertips.
 * - `genuflect`: Append a genuflection: the right knee to the floor beside the
 *   left heel, a brief rest, and the rise, with an optional sign of the cross
 *   first.
 * - `kneelingPrayer`: Append a kneeling prayer: both knees down with the palms
 *   together before the chest for the hold, then the rise.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `TOUCH_HOLD`: How long each touch of the sign of the cross rests, seconds
 *   (provisional).
 * - `SITE`: How far from a region's centre the sign of the cross may land,
 *   metres: the patch a fingertip touch reaches (provisional).
 * - `GENUFLECT_HOLD`: How long a genuflection rests on the knee, seconds
 *   (provisional).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanRitual} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanRitual {
  /**
   * Append the sign of the cross: forehead, sternum, then both shoulders in the
   * rite's order, with one hand's fingertips.
   *
   * @param chain The performer's chain.
   * @param params The signing `hand` (the right when absent) and the `rite`
   *   (the Latin rite when absent).
   * @returns The chain with four touches appended.
   */
  export const signOfCross: typeof signOfCrossLaw = signOfCrossLaw;

  /**
   * Append a genuflection: the right knee to the floor beside the left heel, a
   * brief rest, and the rise, with an optional sign of the cross first.
   *
   * @param chain The performer's chain.
   * @param params Whether to sign the `cross` before kneeling; `false` when
   *   absent.
   * @returns The chain with the genuflection appended.
   */
  export const genuflect: typeof genuflectLaw = genuflectLaw;

  /**
   * Append a kneeling prayer: both knees down with the palms together before
   * the chest for the hold, then the rise.
   *
   * The palms meet as both knees settle and stay together for the hold: the
   * gesture is synced to the kneel's `settled`, its stroke ending there, and
   * holds as long as the kneel does, so it retracts as the first knee lifts.
   *
   * @param chain The performer's chain.
   * @param params The `hold` in seconds of kneeling in prayer.
   * @param anchor The kneel's anchor the gesture syncs to; `kneelingPrayer`
   *   when absent. A chain that prays more than once gives each prayer its
   *   own.
   * @returns The chain with the prayer appended.
   */
  export const kneelingPrayer: typeof kneelingPrayerLaw = kneelingPrayerLaw;

  /** How long each touch of the sign of the cross rests, seconds (provisional). */
  export const TOUCH_HOLD: typeof TOUCH_HOLDSource = TOUCH_HOLDSource;

  /**
   * How far from a region's centre the sign of the cross may land, metres: the
   * patch a fingertip touch reaches (provisional).
   */
  export const SITE: typeof SITESource = SITESource;

  /** How long a genuflection rests on the knee, seconds (provisional). */
  export const GENUFLECT_HOLD: typeof GENUFLECT_HOLDSource =
    GENUFLECT_HOLDSource;
}
