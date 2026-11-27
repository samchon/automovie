import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanGetDressed,
} from "@automovie/interface";

/*
 * Stage a cuff adjustment by presenting the sleeved wrist across the waist and
 * bringing the opposite hand's curled fingertips to the cuff for a brief hold.
 * The wrist serves as the garment landmark.
 * Parameter chain: The performer's entry chain.
 * Parameter params: The `cuff` side of the sleeve being adjusted.
 * Parameter anchor: A stable cue id for the adjustment.
 * Returns: The same kind of chain with one touch appended.
 */
export function composeHumanAdjustCuff<
  Chain extends IAutoMovieMotionHumanChainCore,
>(
  chain: Chain,
  params: IAutoMovieMotionHumanGetDressed.IAdjustCuff,
  anchor?: string,
): Chain {
  const cuff = params.cuff;
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
