import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { PULSE_HOLD } from "./PULSE_HOLD";

/**
 * Feel the partner's pulse with the fingertips for `PULSE_HOLD` seconds.
 *
 * @param chain The carer's chain.
 * @param params The `partner`, the pulse `site` and the feeling `side`; the right hand when absent.
 * @returns The chain with the check appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sites and the hold.
 * @evidence contracts/development/implementation.md#principled-implementation A fingertip hold on the partner's neck or wrist region.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function pulse<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanCare.IPulse,
): Chain {
  const side: AutoMovieHumanSide = params.side ?? "right";
  const region: AutoMovieHumanoidRegion =
    params.site === "carotid" ? "neckLeft" : "wristLeft";
  return chain.act("touch", {
    target: { kind: "person", subject: params.partner, region },
    hand: side,
    kind: "hold",
    effector: "fingertips",
    hold: PULSE_HOLD,
  });
}
