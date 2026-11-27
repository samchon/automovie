import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { PULSE_HOLD } from "./PULSE_HOLD";

/*
 * Feel the partner's pulse with the fingertips for `PULSE_HOLD` seconds.
 * Parameter chain: The carer's chain.
 * Parameter params: The `partner`, the pulse `site` and the feeling `side`; the
 * right hand when absent.
 * Returns: The chain with the check appended.
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
