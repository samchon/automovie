import type {
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The crawl's posture once down: the hips travelling at a constant speed
 * through the cycles, each limb at its course's place, the trunk at the crawl's
 * full lean.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `crawling`.
 */
export function crawlCrawling(
  prepared: crawlCrawling.IPrepared,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const {
    kneeling,
    place,
    speed,
    cycles,
    period,
    downAt,
  }: crawlCrawling.IPrepared = prepared;
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture =>
    kneeling(
      posture,
      (limb: IAutoMovieMotionHumanCrawl.Limb) => place(limb, seconds),
      speed * Math.min(cycles * period, Math.max(0, seconds - downAt)),
      0,
      1,
    );
}

/*
 * The `crawling` of `crawl.plan`, built from what that plan prepared.
 */
export namespace crawlCrawling {
  /*
   * What `crawl.plan` prepared for its `crawling`.
   */
  export interface IPrepared {
    /*
     * The `kneeling` `crawl.plan` prepared.
     */
    kneeling: (
      posture: IAutoMovieMotionHumanPosture,
      at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
      level: number,
      back: number,
      lean: number,
      palms?: boolean,
    ) => IAutoMovieMotionHumanPosture;

    /*
     * The `place` `crawl.plan` prepared.
     */
    place: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      seconds: number,
    ) => IAutoMovieVector3;

    /*
     * The `speed` `crawl.plan` prepared.
     */
    speed: number;

    /*
     * The `cycles` `crawl.plan` prepared.
     */
    cycles: number;

    /*
     * The `period` `crawl.plan` prepared.
     */
    period: number;

    /*
     * The `downAt` `crawl.plan` prepared.
     */
    downAt: number;
  }
}
