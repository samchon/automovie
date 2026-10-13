/**
 * The part of a basis surface region that skin selection reads: its ID and the material it draws.
 *
 * @evidence contracts/common.md#principled-implementation Region ID and material ID provide the exact fields used to identify a skin-drawing surface; geometry remains with the full basis surface.
 * @evidence contracts/common.md#clear-and-simple-design The region projection avoids importing an entire face or body region schema into generic skin selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material identity is supplied by the source region, without a fixture region list or inferred geometry label.
 * @evidence contracts/common.md#meaningful-documentation The two members distinguish region identity from the material it draws.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The region identity and material selection fields are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the region identity and material selection fields; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring region identity and material selection fields acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinCandidateRegion {
  /** The region's ID. */
  id: string;

  /** The material the region draws. */
  material: string;
}
