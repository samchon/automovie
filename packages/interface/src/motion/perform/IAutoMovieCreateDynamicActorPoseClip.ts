import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * Data and callback contracts shared by the CreateDynamicActorPoseClip
 * operations.
 */
export namespace IAutoMovieCreateDynamicActorPoseClip {
  /**
   * Bake a live pose callback at 24 Hz plus exact caller landmarks over a
   * positive second duration. Return null if any callback sample cannot
   * resolve; successful samples form a non-looping linear clinical-pose clip.
   */
  export type IProps = {
    /** Caller-selected output motion identity. */
    id: string;

    /** Skeleton id shared by every callback pose. */
    skeleton: string;

    /** Finite strictly positive clip span in seconds. */
    duration: number;

    /**
     * Resolve an admitted clinical pose at local seconds; null refuses the
     * complete bake and thrown errors propagate.
     */
    poseAt: (time: number) => IAutoMoviePose | null;

    /**
     * Additional finite in-span seconds that must be sampled exactly;
     * duplicates collapse with the regular grid.
     */
    landmarks?: readonly number[];
  };
}
