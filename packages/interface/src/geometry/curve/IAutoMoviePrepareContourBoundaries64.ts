import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { IAutoMoviePrepareContourBoundaries64Group } from "./IAutoMoviePrepareContourBoundaries64Group";

/**
 * Shared contour-boundary preparation plans and their local qualification.
 *
 * prepareAutoMovieContourBoundaries64 refines all supported groups until no
 * source restriction changes, prepares their slits, then repeats refinement if
 * slit insertion added points. Incident slabs share ring objects and inherited
 * phase identity. Callers supply admitted section indices and source callbacks;
 * this stage does not infer missing topology or weld coincident coordinates.
 *
 * @evidence contracts/development/design.md#principled-representation Section indices address adjacent cuts while group object identity associates qualification with the same mutable incidence record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Input plans and output qualification share only the meaningful group type parameter; no unused ring parameter widens this surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported groups and arithmetic failures remain local reasons; finite retained geometry is not promoted to certified source fidelity.
 * @evidence contracts/development/common.md#meaningful-documentation Defines index semantics, shared mutation, refinement ordering, diagnostic history and optional timing.
 */
export namespace IAutoMoviePrepareContourBoundaries64 {
  /**
   * Borrowed adjacent-section work list. Preparation may set a group's
   * unsupported reason and mutate its incident rings through source refinement;
   * keep those objects shared by every slab that names them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each upper section ordinal k addresses the shared rings[k-1]/rings[k] boundary and its declared local groups. The generic preserves concrete group metadata; index validity and shared ring identity are admitted upstream, while unsupported groups remain explicit.
   * @evidence contracts/development/design.md#principled-representation Each upper section ordinal k addresses the shared rings[k-1]/rings[k] boundary and its declared local groups.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contour-loft work supplies these borrowed group objects to prepareAutoMovieContourBoundaries64.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The generic preserves concrete group metadata; index validity and shared ring identity are admitted upstream, while unsupported groups remain explicit.
   */
  export type IPlans<G extends IAutoMoviePrepareContourBoundaries64Group> = {
    /** Upper section index: the two sides are rings[k-1] and rings[k]. */
    k: number;
    /** Local incidence records in declared group order; no group is synthesized. */
    groups: G[];
  }[];

  /**
   * Newly allocated qualification map and work observations for one preparation.
   * Result keys borrow original group objects. A group's qualification can be
   * revised by later shared refinement; diagnostic history preserves prior
   * passes. This record owns no native resource and requires no release method.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Group-object keys carry latest interaction qualification and diagnostic history; observations retain millimetre endpoints and optional millisecond timings. Trace messages can survive successful qualification, and later slit failures can coexist with earlier interaction entries; consumers must inspect group status too.
   * @evidence contracts/development/design.md#principled-representation Group-object keys carry latest interaction qualification and diagnostic history; observations retain millimetre endpoints and optional millisecond timings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Boundary preparation returns the new maps and traces to contour-loft emission while borrowing original group keys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Trace messages can survive successful qualification, and later slit failures can coexist with earlier interaction entries; consumers must inspect group status too.
   */
  export type IResult<G extends IAutoMoviePrepareContourBoundaries64Group> = {
    /**
     * Latest lower-and-upper interaction qualification for each visited group.
     * Initially unsupported groups are skipped. A later slit failure may set
     * group.unsupported while leaving its earlier interaction entry present.
     */
    interactions: Map<
      G,
      {
        /** Both section sides qualified on the latest pass; arithmetic failure sets false. */
        qualified: boolean;
        /**
         * Deduplicated, pass-prefixed contact/separation history across successful
         * passes. A caught arithmetic failure replaces it with that failure's
         * message. Nonempty trace alone does not imply failed qualification.
         */
        diagnostics: string[];
      }
    >;
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
}
