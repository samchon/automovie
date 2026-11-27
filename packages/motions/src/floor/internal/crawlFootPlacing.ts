import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { crawlFeet } from "./crawlFeet";

/**
 * Each tucked foot's placement reader at its toe joint (`HumanFoot.prepareAt`
 * at the mtp socket), whose contact point alone changes as the foot follows its
 * knee.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `placing`.
 */
export function crawlFootPlacing(
  prepared: crawlFootPlacing.IPrepared,
): (side: AutoMovieHumanSide) => ReturnType<typeof HumanFoot.prepareAt> {
  const { body, tucks }: crawlFootPlacing.IPrepared = prepared;
  return (side: AutoMovieHumanSide): ReturnType<typeof HumanFoot.prepareAt> =>
    HumanFoot.prepareAt(
      body,
      side,
      "mtp",
      tucks[side].foot.heading,
      tucks[side].foot.pitch,
    );
}

/** The `placing` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlFootPlacing {
  /** What `crawl.plan` prepared for its `placing`. */
  export interface IPrepared {
    /** The `body` `crawl.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `tucks` `crawl.plan` prepared. */
    tucks: ReturnType<typeof crawlFeet.planted>["tucks"];
  }
}
