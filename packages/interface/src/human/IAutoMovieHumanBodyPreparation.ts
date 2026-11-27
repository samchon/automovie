import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySources } from "./IAutoMovieHumanBodySources";
import type { IAutoMovieHumanSkeletonLaw } from "./IAutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanTrunkConstruction } from "./IAutoMovieHumanTrunkConstruction";
import type { IAutoMovieHumanHeadLane } from "./IAutoMovieHumanHeadLane";

/**
 * Complete production preparation over the original body context, including
 * head, eye and bind metadata.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyPreparation
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBodyPreparation {
  /**
   * Explicit production preparation adds actual head/eye and whole bind
   * metadata to the same original context.
   */
  export interface IOutput
    extends
      IAutoMovieHumanBodySources.IOriginal,
      IAutoMovieHumanBodySources.ICommon {
    /**
     * Actual completed receiver boundary, requested only by production or
     * legacy body consumers.
     */
    readonly neckConnection: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    >["connection"];

    /** Same original cut's legacy support interpretation. */
    readonly seat: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    >["seat"];

    /** Actual prepared head, requested by complete. */
    readonly head: IAutoMovieHumanHeadLane.IPrepared;

    /**
     * Placement metadata with actual head records; raw chains remain
     * unrequested.
     */
    readonly standing: IAutoMovieHumanBodyCalibration;

    /** Same original trunk solution and its production metadata. */
    readonly trunkPlacement: IAutoMovieHumanTrunkConstruction.IPlacement;

    /** Complete actual bind skeleton, including head/eye-owned bones. */
    readonly anatomy: IAutoMovieHumanSkeletonLaw.IOutput;
  }
}
