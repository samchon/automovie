import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanGetDressed,
} from "@automovie/interface";

/**
 * Stage straightening a partner's tie, facing them: the flat palm of one hand
 * smooths the tie's front blade along the partner's sternum with one short
 * sweep, as `composeHumanStraightenTie` does on one's own with the fingertips;
 * on another's chest the palm lays the blade flat. The partner's sternum is the
 * garment's landmark, read where the partner stands when the touch starts, so
 * the partner is placed first.
 *
 * @param chain The dresser's entry chain.
 * @param params The partner whose tie is straightened and the smoothing side.
 * @param anchor A stable cue id for the smoothing action.
 * @returns The same kind of chain with one touch appended.
 */
export function composeHumanStraightenPartnerTie<
  Chain extends IAutoMovieMotionHumanChainCore,
>(
  chain: Chain,
  params: IAutoMovieMotionHumanGetDressed.IStraightenPartnerTie,
  anchor?: string,
): Chain {
  const { partner, side } = params;
  return chain.act(
    "touch",
    {
      target: { kind: "person", subject: partner, region: "sternum" },
      hand: side,
      kind: "rub",
      effector: "palm",
      tangent: "up",
      count: 1,
      hold: 0,
    },
    anchor,
  );
}
