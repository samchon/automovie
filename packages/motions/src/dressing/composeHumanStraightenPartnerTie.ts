import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Stage straightening a partner's tie, facing them (#4015): the flat palm
 * of one hand smooths the tie's front blade along the partner's sternum with
 * one short sweep, as `composeHumanStraightenTie` does on one's own with the
 * fingertips; on another's chest the palm lays the blade flat. The
 * partner's sternum is the garment's landmark, read where the partner
 * stands when the touch starts, so the partner is placed first.
 *
 * @param chain The dresser's entry chain.
 * @param partner The performer whose tie is straightened.
 * @param side The smoothing hand.
 * @param anchor A stable cue id for the smoothing action.
 * @returns The same kind of chain with one touch appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States whose tie, the gesture, the chosen hand and the cue's meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the touch law's partner region target and its rub form, the self version's sweep turned onto another person.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Appends one touch with an explicit vertical tangent and one stroke.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the touch law's surface frame, rub period and hand-length travel; its reach refusal stands.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One action is appended through the chain operator.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the touch law; separate adjustments share no computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns the appended intent; the composer retains no state.
 */
export function composeHumanStraightenPartnerTie<
  Chain extends IAutoMovieMotionHumanChainCore,
>(
  chain: Chain,
  partner: string,
  side: AutoMovieHumanSide,
  anchor?: string,
): Chain {
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
