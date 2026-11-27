import type {
  IAutoMovieMotionHumanCare,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/*
 * Press a wound with both palms and hold.
 * Parameter chain: The carer's chain.
 * Parameter params: The `partner`, the wounded `region` and the seconds `hold` the
 * pressure is held.
 * Returns: The chain with the pressure appended.
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
