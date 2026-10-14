import type { IAutoMovieHumanPersonSkinCandidateRegion } from "./IAutoMovieHumanPersonSkinCandidateRegion";

/**
 * Structural surface projection for skin selection: regions supply material membership and the original ID remains available on the returned borrowed surface. The selector does not compare surface IDs.
 *
 * @evidence contracts/common.md#principled-implementation Region material membership selects the surface while the generic result preserves its original object and identity; surface ID is not a selection predicate.
 * @evidence contracts/common.md#clear-and-simple-design The structural projection keeps skin selection independent of face-specific or body-specific basis details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidates carry caller region metadata; the selector's supported skin-material convention is outside this type rather than an embedded example surface.
 * @evidence contracts/common.md#meaningful-documentation Comments identify surface identity and material-region membership used by selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The surface selection projection of identity and regions are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the surface selection projection of identity and regions; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring surface selection projection of identity and regions acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinCandidate {
  /** The surface's ID. */
  id: string;

  /** The surface's material regions. */
  regions: IAutoMovieHumanPersonSkinCandidateRegion[];
}
