import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanRitual,
} from "@automovie/interface";

/**
 * Append a kneeling prayer: both knees down with the palms together before the
 * chest for the hold, then the rise.
 *
 * The palms meet as both knees settle and stay together for the hold: the
 * gesture is synced to the kneel's `settled`, its stroke ending there, and
 * holds as long as the kneel does, so it retracts as the first knee lifts.
 *
 * @param chain The performer's chain.
 * @param params The `hold` in seconds of kneeling in prayer.
 * @param anchor The kneel's anchor the gesture syncs to; `kneelingPrayer` when
 *   absent. A chain that prays more than once gives each prayer its own.
 * @returns The chain with the prayer appended.
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
