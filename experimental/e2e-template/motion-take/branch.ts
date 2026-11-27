import { AutoMovieMotionHumanChain } from "@automovie/motions";

import type { IMotionTakeSource } from "../../src/executable/motionTake/IMotionTakeSource";
import { fixture, takeMetadata } from "./source";

/** Replace the old tail on a separately addressable take. */
export function createMotionTakeSource(): IMotionTakeSource {
  return createAlternative("changed-suffix", "new-tail", 0.04);
}

/** Publish a sibling using the same source clocks and one standalone replacement. */
export function createAlternative(
  take: string,
  tail: string,
  sway: number,
): IMotionTakeSource {
  return {
    ...takeMetadata(),
    take,
    human: {},
    bindings: [],
    branch: {
      artifact: fixture.artifact,
      source: fixture.source,
      retainedParts: 1,
      suffix: AutoMovieMotionHumanChain.subject("catcher").registered(
        "stand",
        { hold: 1, sway },
        tail,
      ).node,
    },
  };
}
