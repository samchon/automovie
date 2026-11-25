import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { crawlFrame } from "./crawlFrame";

/**
 * The crawl's frame posture (`crawlFrame.posed`) at a share of its pitch and a
 * turn of `degrees`, its hips hiked by `hike`, under the body's own heading.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `posed`.
 */
export function crawlPosed(
  prepared: crawlPosed.IPrepared,
): (
  share: number,
  degrees: number,
  hike?: number,
) => IAutoMovieMotionHumanPosture {
  const { body, yaw }: crawlPosed.IPrepared = prepared;
  return (
    share: number,
    degrees: number,
    hike: number = 0,
  ): IAutoMovieMotionHumanPosture =>
    crawlFrame.posed(body, yaw, share, degrees, hike, -40);
}

/** The `posed` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlPosed {
  /** What `crawl.plan` prepared for its `posed`. */
  export interface IPrepared {
    /** The `body` `crawl.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `yaw` `crawl.plan` prepared. */
    yaw: number;
  }
}
