import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A palm's floor place under its shoulder: the shoulder's point less its
 * wrist's offset, so the wrist stands under the shoulder.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `under`.
 */
export function crawlUnder(
  prepared: crawlUnder.IPrepared,
): (side: AutoMovieHumanSide) => IAutoMovieVector3 {
  const { local, wrists }: crawlUnder.IPrepared = prepared;
  return (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const shoulder: IAutoMovieVector3 = local(`${side}UpperArm`);
    return {
      x: shoulder.x - wrists[side].x,
      y: 0,
      z: shoulder.z - wrists[side].z,
    };
  };
}

/** The `under` of `crawl.plan`, built from what that plan prepared. */
export namespace crawlUnder {
  /** What `crawl.plan` prepared for its `under`. */
  export interface IPrepared {
    /** The `local` `crawl.plan` prepared. */
    local: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3;

    /** The `wrists` `crawl.plan` prepared. */
    wrists: Record<AutoMovieHumanSide, IAutoMovieVector3>;
  }
}
