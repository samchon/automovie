import type { IAutoMovieMotionHumanCrawl } from "@automovie/interface";

/*
 * The limbs' mean placement share where the crawl lands, the stride's offset
 * its first prints take.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `landed`.
 */
export function crawlLanded(prepared: crawlLanded.IPrepared): number {
  const { limbs, centred }: crawlLanded.IPrepared = prepared;
  return (
    limbs
      .map((limb: IAutoMovieMotionHumanCrawl.Limb): number => centred(limb, 0))
      .reduce((a: number, b: number): number => a + b, 0) / limbs.length
  );
}

/*
 * The `landed` of `crawl.plan`, built from what that plan prepared.
 */
export namespace crawlLanded {
  /*
   * What `crawl.plan` prepared for its `landed`.
   */
  export interface IPrepared {
    /*
     * The `limbs` `crawl.plan` prepared.
     */
    limbs: IAutoMovieMotionHumanCrawl.Limb[];

    /*
     * The `centred` `crawl.plan` prepared.
     */
    centred: (limb: IAutoMovieMotionHumanCrawl.Limb, j: number) => number;
  }
}
