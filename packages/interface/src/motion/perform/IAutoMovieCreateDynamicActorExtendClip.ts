import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * Data and callback contracts shared by the CreateDynamicActorExtendClip
 * operations.
 */
export namespace IAutoMovieCreateDynamicActorExtendClip {
  /**
   * Bake a moving arm goal with an easeInOut extension over the first half of a
   * positive second duration, then hold its sampled solved articulation. An
   * unresolved target sample returns null.
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
  };
}
