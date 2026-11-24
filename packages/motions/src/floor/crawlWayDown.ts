import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { kneel } from "../everyday/kneel";
import { crawl } from "./crawl";
import { crawlDown } from "./crawlDown";
import { crawlFeet } from "./crawlFeet";
import { floorEntry } from "./floorEntry";

/**
 * The way down from standing onto all fours (`crawlDown`), or none when the
 * crawl is entered from the floor: the supports take the body in turn, each
 * foot rolling onto its tucked place, and the sit lowers the hips onto the
 * knees and back over the heels.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `down`.
 */
export function crawlWayDown(
  prepared: crawlWayDown.IPrepared,
): crawlDown.IDown | null {
  const {
    entered,
    body,
    standing,
    context,
    period,
    kneeling,
    print,
    pitch,
    tucks,
    bear,
  }: crawlWayDown.IPrepared = prepared;
  return entered !== null
    ? null
    : crawlDown({
        body,
        standing,
        entry: context.entry.pose,
        sit: ((kneel.PHASES.lower + kneel.PHASES.sit) * period) / crawl.CYCLE,
        kneeling: (
          posture: IAutoMovieMotionHumanPosture,
          back: number,
          lean: number,
          palms?: boolean,
        ): IAutoMovieMotionHumanPosture =>
          kneeling(
            posture,
            (limb: IAutoMovieMotionHumanCrawl.Limb) => print(limb, 0),
            0,
            back,
            lean,
            palms,
          ),
        pitch,
        tucks,
        hover: bear,
      });
}

/** The `down` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlWayDown {
  /** What `crawl.plan` prepared for its `down`. */
  export interface IPrepared {
    /** The `entered` `crawl.plan` prepared. */
    entered: floorEntry.IStart["entered"];

    /** The `body` `crawl.plan` prepared. */
    body: IAutoMovieMotionHumanBody;

    /** The `standing` `crawl.plan` prepared. */
    standing: floorEntry.IStart["standing"];

    /** The `context` `crawl.plan` prepared. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrawl.IParams>;

    /** The `period` `crawl.plan` prepared. */
    period: number;

    /** The `kneeling` `crawl.plan` prepared. */
    kneeling: (
      posture: IAutoMovieMotionHumanPosture,
      at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
      level: number,
      back: number,
      lean: number,
      palms?: boolean,
    ) => IAutoMovieMotionHumanPosture;

    /** The `print` `crawl.plan` prepared. */
    print: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      j: number,
    ) => IAutoMovieVector3;

    /** The `pitch` `crawl.plan` prepared. */
    pitch: number;

    /** The `tucks` `crawl.plan` prepared. */
    tucks: ReturnType<typeof crawlFeet.planted>["tucks"];

    /** The `bear` `crawl.plan` prepared. */
    bear: boolean;
  }
}
