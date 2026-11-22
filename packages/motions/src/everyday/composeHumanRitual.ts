import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Devotional acts composed from shipped actions (#3985): the sign of the
 * cross, a genuflection and a kneeling prayer. Each appends shipped actions
 * to a performer's chain, so they are fitted, refused and checked as those
 * actions are.
 *
 * - The sign of the cross touches the forehead, the sternum and both
 *   shoulders with the fingertips, in that order. The Latin rite crosses the
 *   shoulders left then right, the Byzantine rite right then left.
 * - A genuflection lowers the right knee to the floor beside the left heel
 *   and rises at once (General Instruction of the Roman Missal, no. 274),
 *   optionally signing the cross on the knee.
 * - A kneeling prayer kneels on both knees with the palms together before
 *   the chest for the authored hold, then rises.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each act, its order and its sources.
 * @evidence contracts/development/design.md#principled-representation Each act is data over the shipped touch, kneel and gesture actions; the rite is a closed choice of the shoulder order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the compositions the ritual scenes use; posture and contact remain the composed actions' own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; every motion is planned by the shipped action.
 */
export namespace composeHumanRitual {
  /** Which shoulder the sign of the cross touches first: the Latin rite's left or the Byzantine rite's right. */
  export type Rite = "latin" | "byzantine";

  /** How long each touch of the sign of the cross rests, seconds (provisional). */
  export const TOUCH_HOLD: number = 0.15;

  /** How far from a region's centre the sign of the cross may land, metres: the patch a fingertip touch reaches (provisional). */
  export const SITE: number = 0.06;

  /** How long a genuflection rests on the knee, seconds (provisional). */
  export const GENUFLECT_HOLD: number = 0.4;

  /**
   * Append the sign of the cross: forehead, sternum, then both shoulders in
   * the rite's order, with one hand's fingertips.
   *
   * @param chain The performer's chain.
   * @param side The signing hand; the right when absent.
   * @param rite The shoulder order; the Latin rite when absent.
   * @returns The chain with four touches appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and both defaults.
   * @evidence contracts/development/implementation.md#principled-implementation Four fingertip touches on the named self regions in the traditional order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered list of regions, one touch each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses every contact; nothing is posed here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function signOfCross<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    side: AutoMovieHumanSide = "right",
    rite: Rite = "latin",
  ): Chain {
    const order: readonly CrossRegion[] =
      rite === "latin"
        ? ["forehead", "sternum", "shoulderLeft", "shoulderRight"]
        : ["forehead", "sternum", "shoulderRight", "shoulderLeft"];
    return order.reduce(
      (current: Chain, region: CrossRegion): Chain =>
        current.act("touch", {
          target: { kind: "self", region },
          hand: side,
          kind: "hold",
          effector: "fingertips",
          hold: TOUCH_HOLD,
          // The patch of each region nearest the signing shoulder: the front
          // of the shoulder a hand reaches across the chest, not its top.
          site: { rule: "reach", within: SITE },
        }),
      chain,
    );
  }

  /**
   * Append a genuflection: the right knee to the floor beside the left heel,
   * a brief rest, and the rise, with an optional sign of the cross first.
   *
   * @param chain The performer's chain.
   * @param cross Whether to sign the cross before kneeling.
   * @returns The chain with the genuflection appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which knee lowers, the rest and the option.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped one-knee kneel on the right knee with a rise, as the Roman Missal describes the genuflection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An optional sign of the cross, then one kneel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kneel law places the knee and refuses an infeasible one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most five appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function genuflect<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    cross: boolean = false,
  ): Chain {
    return (cross ? signOfCross(chain) : chain).act("kneel", {
      kind: "one",
      knee: "right",
      hold: GENUFLECT_HOLD,
      rise: true,
    });
  }

  /**
   * Append a kneeling prayer: both knees down with the palms together before
   * the chest for the hold, then the rise.
   *
   * The palms meet as both knees settle and stay together for the hold:
   * the gesture is synced to the kneel's `settled`, its stroke ending there,
   * and holds as long as the kneel does, so it retracts as the first knee
   * lifts.
   *
   * @param chain The performer's chain.
   * @param hold Seconds kneeling in prayer.
   * @param anchor The kneel's anchor the gesture syncs to; a chain that prays more than once gives each prayer its own.
   * @returns The chain with the prayer appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture, the hands, when they join, the hold and the anchor.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped both-knee kneel carries the palms-together gesture over it, its stroke ending at the kneel's `settled` and its post-stroke hold the kneel's own, so the palms are together for exactly the kneeling hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kneel with one synced gesture over it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kneel and gesture laws plan and refuse; nothing is posed here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appends.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function kneelingPrayer<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    hold: number,
    anchor: string = "kneelingPrayer",
  ): Chain {
    return chain
      .act("kneel", { kind: "both", hold, rise: true }, anchor)
      .over(
        (overlay: Chain): IAutoMovieMotionHumanChainCore =>
          overlay
            .act("gesture", { kind: "palmsTogether", hold })
            .sync({ of: anchor, event: "settled", align: "strokeEnd" }),
      );
  }

  /** The self regions the sign of the cross touches. */
  export type CrossRegion =
    | "forehead"
    | "sternum"
    | "shoulderLeft"
    | "shoulderRight";
}
