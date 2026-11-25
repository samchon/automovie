import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * Data and callback contracts shared by the CreateDynamicActorJabClip
 * operations.
 */
export namespace IAutoMovieCreateDynamicActorJabClip {
  /**
   * Bake a moving strike goal with an easeIn envelope to the 40% peak and
   * easeOut retraction over the remaining positive second duration. An
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
