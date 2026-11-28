import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMoviePrepareContourBoundaries64Group } from "./IAutoMoviePrepareContourBoundaries64Group";

/**
 * Shared contour-boundary preparation plans and their local qualification.
 *
 * PrepareAutoMovieContourBoundaries64 refines all supported groups until no
 * source restriction changes, prepares their slits, then repeats refinement if
 * slit insertion added points. Incident slabs share ring objects and inherited
 * phase identity. Callers supply admitted section indices and source callbacks;
 * this stage does not infer missing topology or weld coincident coordinates.
 */
export namespace IAutoMoviePrepareContourBoundaries64 {
  /**
   * Borrowed adjacent-section work list. Preparation may set a group's
   * unsupported reason and mutate its incident rings through source refinement;
   * keep those objects shared by every slab that names them.
   */
  export type IPlans<G extends IAutoMoviePrepareContourBoundaries64Group> =
    IIntervalPlan<G>[];

  /** Borrowed incidence work for one adjacent pair of sections. */
  export type IIntervalPlan<
    G extends IAutoMoviePrepareContourBoundaries64Group,
  > = {
    /** Upper section index: the two sides are rings[k-1] and rings[k]. */
    k: number;
    /** Local incidence records in declared group order; no group is synthesized. */
    groups: G[];
  };

  /**
   * Newly allocated qualification map and work observations for one
   * preparation. Result keys borrow original group objects. A group's
   * qualification can be revised by later shared refinement; diagnostic history
   * preserves prior passes. This record owns no native resource and requires no
   * release method.
   */
  export type IResult<G extends IAutoMoviePrepareContourBoundaries64Group> = {
    /**
     * Latest lower-and-upper interaction qualification for each visited group.
     * Initially unsupported groups are skipped. A later slit failure may set
     * group.unsupported while leaving its earlier interaction entry present.
     */
    interactions: Map<G, IInteractionQualification>;
    /**
     * Per-pass observations for section sides containing multiple selected
     * rings, with physical millimetre endpoints and local group/side addresses.
     * Counts are retained regardless of timing selection; elapsedMs is null
     * unless observeWork was requested. A caught failure can leave work
     * observation incomplete, which its interaction diagnostic states.
     */
    observations: NonNullable<
      IAutoMovieContourLoft64.IResult["interactionObservations"]
    >;
  };

  /** Latest qualification and diagnostic history for one visited group. */
  export type IInteractionQualification = {
    /**
     * True when both section sides qualified on the latest pass. A caught
     * arithmetic failure sets false.
     */
    qualified: boolean;

    /**
     * Deduplicated, pass-prefixed contact and separation history. A caught
     * arithmetic failure replaces the trace with its failure message. A
     * nonempty successful-pass trace can accompany a true qualification.
     */
    diagnostics: string[];
  };
}
