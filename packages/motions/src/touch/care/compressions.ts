import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { COMPRESSION_CYCLE } from "./COMPRESSION_CYCLE";

/**
 * One cycle of chest compressions: both palms press the partner's sternum.
 *
 * @param chain The carer's chain.
 * @param params The `partner`, whose subject is pressed.
 * @returns The chain with the compressions appended.
 */
export function compressions<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanCare.ICompressions,
): Chain {
  return chain.act("touch", {
    target: { kind: "person", subject: params.partner, region: "sternum" },
    other: { kind: "person", subject: params.partner, region: "sternum" },
    kind: "press",
    effector: "palm",
    arms: "straight",
    count: COMPRESSION_CYCLE,
    hold: 0,
  });
}
