import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Kneel on both knees beside the partner and stay down for the care that
 * follows, the right knee coming down at the floor point beside the partner, so
 * the knees end against the side of a lying partner rather than a reverse lunge
 * back from it.
 *
 * @param chain The carer's chain.
 * @param params The `at` floor point beside the partner the right knee comes
 *   down on.
 * @returns The chain with the kneel appended.
 */
export function kneelBeside<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanCare.IKneelBeside,
): Chain {
  return chain.act("kneel", {
    kind: "both",
    hold: 0,
    rise: false,
    at: params.at,
  });
}
