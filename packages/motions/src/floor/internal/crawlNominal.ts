import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Each limb's nominal place relative to the hips' travel, floor frame: each
 * palm under its shoulder and each knee under its hip joint at the knee's
 * height.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `nominal`.
 */
export function crawlNominal(
  prepared: crawlNominal.IPrepared,
): Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> {
  const { under, local, knee }: crawlNominal.IPrepared = prepared;
  return {
    leftHand: under("left"),
    rightHand: under("right"),
    leftKnee: { ...local("leftUpperLeg"), y: knee },
    rightKnee: { ...local("rightUpperLeg"), y: knee },
  };
}

/*
 * The `nominal` of `crawl.plan`, built from what that plan prepared.
 */
export namespace crawlNominal {
  /*
   * What `crawl.plan` prepared for its `nominal`.
   */
  export interface IPrepared {
    /*
     * The `under` `crawl.plan` prepared.
     */
    under: (side: AutoMovieHumanSide) => IAutoMovieVector3;

    /*
     * The `local` `crawl.plan` prepared.
     */
    local: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3;

    /*
     * The `knee` `crawl.plan` prepared.
     */
    knee: number;
  }
}
