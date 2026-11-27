import type { IAutoMovieHumanPose } from "./IAutoMovieHumanPose";
import type { IAutoMovieHumanPoseProjection } from "./IAutoMovieHumanPoseProjection";

/**
 * Type contracts exchanged by AutoMovieHumanPreparedKinematics; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanPreparedKinematics {
  /**
   * A body-local selection retains requested outputs and every required
   * ancestor.
   */
  export interface ISelection {
    /**
     * Parent-before-child calculation population, including girdle
     * dependencies.
     */
    work: readonly number[];

    /** Requested placement identities; ancestors need not escape the kernel. */
    output: ReadonlySet<string>;
  }

  /**
   * Explicit body lifetime; no input poses or public output arrays are
   * retained.
   */
  export interface IPrepared {
    /**
     * Read every clinical channel and return fresh placement arrays and clamp
     * rows. clamp applies clinical limits; omitted selection returns every
     * bone, while a supplied selection must come from this same prepared body
     * and remain unchanged.
     */
    evaluate: (
      pose: IAutoMovieHumanPose,
      clamp: boolean,
      selection?: ISelection,
    ) => IAutoMovieHumanPoseProjection;

    /**
     * Compile a nonempty list of existing bone identities into a selection for
     * this prepared body, deduplicating outputs and retaining ancestors in
     * parent-first order. Empty or unknown identities throw.
     */
    select: (bones: readonly string[]) => ISelection;
  }
}
