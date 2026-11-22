import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanRitual,
} from "@automovie/interface";

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
 * @param params The `hold` in seconds of kneeling in prayer.
 * @param anchor The kneel's anchor the gesture syncs to; `kneelingPrayer` when absent. A chain that prays more than once gives each prayer its own.
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
  params: IAutoMovieMotionHumanRitual.IKneelingPrayer,
  anchor: string = "kneelingPrayer",
): Chain {
  const hold: number = params.hold;
  return chain
    .act("kneel", { kind: "both", hold, rise: true }, anchor)
    .over(
      (overlay: Chain): IAutoMovieMotionHumanChainCore =>
        overlay
          .act("gesture", { kind: "palmsTogether", hold })
          .sync({ of: anchor, event: "settled", align: "strokeEnd" }),
    );
}