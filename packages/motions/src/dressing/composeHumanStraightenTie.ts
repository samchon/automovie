import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Stage straightening the front blade of a tie with a short up-and-down
 * sweep of the fingertips at the sternum. The sternum serves as the garment
 * landmark. The optional anchor names the smoothing action.
 *
 * @param chain The performer's entry chain.
 * @param side The smoothing hand.
 * @param anchor A stable cue id for the smoothing action.
 * @returns The same kind of chain with one touch appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the part of the tie, the gesture, the chosen hand and the cue's meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the touch law's body-relative sternum target and its rub form for a short smoothing movement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Appends one touch with an explicit vertical tangent and repetition count.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the standard surface frame, rub period and hand-length travel.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One action is appended through the chain operator.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the touch law. Separate adjustments share no computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns the appended intent. The composer retains no state.
 */
export function composeHumanStraightenTie<
  Chain extends IAutoMovieMotionHumanChainCore,
>(chain: Chain, side: AutoMovieHumanSide, anchor?: string): Chain {
  return chain.act(
    "touch",
    {
      target: { kind: "self", region: "sternum" },
      side,
      kind: "rub",
      with: "fingertips",
      tangent: "up",
      count: 1,
      hold: 0,
    },
    anchor,
  );
}
