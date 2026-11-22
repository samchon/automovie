import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { COMPRESSIONS } from "./COMPRESSION_CYCLE";

/**
 * One cycle of chest compressions: both palms press the partner's sternum.
 *
 * @param chain The carer's chain.
 * @param params The `partner`, whose subject is pressed.
 * @returns The chain with the compressions appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target and the count.
 * @evidence contracts/development/implementation.md#principled-implementation The shipped two-hand press on the partner's sternum, repeated `COMPRESSIONS` times.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact; the rate is the law's own press timing.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    count: COMPRESSIONS,
    hold: 0,
  });
}
