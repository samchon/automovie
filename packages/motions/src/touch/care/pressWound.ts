import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Press a wound with both palms and hold.
 *
 * @param chain The carer's chain.
 * @param params The `partner`, the wounded `region` and the seconds `hold` the pressure is held.
 * @returns The chain with the pressure appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target and the hold.
 * @evidence contracts/development/implementation.md#principled-implementation The shipped two-hand press held on the partner's region.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function pressWound<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanCare.IPressWound,
): Chain {
  return chain.act("touch", {
    target: {
      kind: "person",
      subject: params.partner,
      region: params.region,
    },
    other: {
      kind: "person",
      subject: params.partner,
      region: params.region,
    },
    kind: "press",
    effector: "palm",
    count: 1,
    hold: params.hold,
  });
}
