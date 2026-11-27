import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { crawlPitch } from "./crawlPitch";

/**
 * The trunk's pitch that puts the posed shoulders an arm at `ARM` of its length
 * over the wrists and the hip joints a thigh over the knees (`crawlPitch`),
 * with the bones it read.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `solved`.
 */
export function crawlSolvedPitch(
  prepared: crawlSolvedPitch.IPrepared,
): ReturnType<typeof crawlPitch> {
  const { body, measured, hipY, shoulderY, posed }: crawlSolvedPitch.IPrepared =
    prepared;
  return crawlPitch(
    body,
    HumanFrame.point(measured, { x: 0, y: hipY, z: 0 }),
    shoulderY,
    posed(1, 0),
  );
}

/** The `solved` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlSolvedPitch {
  /** What `crawl.plan` prepared for its `solved`. */
  export interface IPrepared {
    /** The `body` `crawl.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `measured` `crawl.plan` prepared. */
    measured: IAutoMovieMotionHumanFrame;

    /** The `hipY` `crawl.plan` prepared. */
    hipY: number;

    /** The `shoulderY` `crawl.plan` prepared. */
    shoulderY: number;

    /** The `posed` `crawl.plan` prepared. */
    posed: (
      share: number,
      degrees: number,
      hike?: number,
    ) => IAutoMovieMotionHumanPosture;
  }
}
