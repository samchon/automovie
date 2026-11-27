import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/*
 * Stage straightening the front blade of a tie with a short up-and-down sweep
 * of the fingertips at the sternum. The sternum serves as the garment landmark.
 * The optional anchor names the smoothing action.
 * Parameter chain: The performer's entry chain.
 * Parameter side: The smoothing hand.
 * Parameter anchor: A stable cue id for the smoothing action.
 * Returns: The same kind of chain with one touch appended.
 */
export function composeHumanStraightenTie<
  Chain extends IAutoMovieMotionHumanChainCore,
>(chain: Chain, side: AutoMovieHumanSide, anchor?: string): Chain {
  return chain.act(
    "touch",
    {
      target: { kind: "self", region: "sternum" },
      hand: side,
      kind: "rub",
      effector: "fingertips",
      tangent: "up",
      count: 1,
      hold: 0,
    },
    anchor,
  );
}
