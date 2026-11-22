import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Stage a cuff adjustment by presenting the sleeved wrist across the waist
 * and bringing the opposite hand's curled fingertips to the cuff for a
 * brief hold. The wrist serves as the garment landmark.
 *
 * @param chain The performer's entry chain.
 * @param cuff The side of the sleeve being adjusted.
 * @param anchor A stable cue id for the adjustment.
 * @returns The same kind of chain with one touch appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which wrist is presented, which hand reaches and how the cue identifies the adjustment.
 * @evidence contracts/development/implementation.md#principled-implementation Opposite-hand self-touch presents the cuff wrist using the existing touch law's body-relative placement and reach rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the wrist and opposite hand and appends a single squeeze.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the anatomical wrist region and the squeeze form's finger closing, with a provisional short dwell for staging.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One action is appended through the chain operator.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the touch law. Separate adjustments share no computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns the appended intent. The composer retains no state.
 */
export function composeHumanAdjustCuff<
  Chain extends IAutoMovieMotionHumanChainCore,
>(chain: Chain, cuff: AutoMovieHumanSide, anchor?: string): Chain {
  return chain.act(
    "touch",
    {
      target: {
        kind: "self",
        region: cuff === "left" ? "wristLeft" : "wristRight",
      },
      hand: cuff === "left" ? "right" : "left",
      kind: "squeeze",
      effector: "fingertips",
      hold: 0.2,
    },
    anchor,
  );
}
