import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/HumanFrame";
import { crawlFeet } from "./crawlFeet";

/**
 * A limb's print on the floor frame: its nominal place moved along the heading
 * by the stride's share at its placement, the landed share for the first.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `print`.
 */
export function crawlPrint(
  prepared: crawlPrint.IPrepared,
): (limb: IAutoMovieMotionHumanCrawl.Limb, j: number) => IAutoMovieVector3 {
  const { frame, nominal, stride, landed, centred }: crawlPrint.IPrepared =
    prepared;
  return (
    limb: IAutoMovieMotionHumanCrawl.Limb,
    j: number,
  ): IAutoMovieVector3 =>
    HumanFrame.point(
      frame,
      Vector3.add(nominal[limb], {
        x: 0,
        y: 0,
        z: stride * (j === 0 ? landed : centred(limb, j)),
      }),
    );
}

/** The `print` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlPrint {
  /** What `crawl.plan` prepared for its `print`. */
  export interface IPrepared {
    /** The `frame` `crawl.plan` prepared. */
    frame: ReturnType<typeof crawlFeet.planted>["frame"];

    /** The `nominal` `crawl.plan` prepared. */
    nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3>;

    /** The `stride` `crawl.plan` prepared. */
    stride: number;

    /** The `landed` `crawl.plan` prepared. */
    landed: number;

    /** The `centred` `crawl.plan` prepared. */
    centred: (limb: IAutoMovieMotionHumanCrawl.Limb, j: number) => number;
  }
}
