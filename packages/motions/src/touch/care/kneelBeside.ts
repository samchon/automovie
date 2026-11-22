import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Kneel on both knees beside the partner and stay down for the care that
 * follows, the right knee coming down at the floor point beside the
 * partner, so the knees end against the side of a lying partner rather
 * than a reverse lunge back from it.
 *
 * @param chain The carer's chain.
 * @param params The `at` floor point beside the partner the right knee comes down on.
 * @returns The chain with the kneel appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture and the knee's place.
 * @evidence contracts/development/implementation.md#principled-implementation The shipped both-knee kneel at a named knee point without the rise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kneel law places and refuses the knees.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
