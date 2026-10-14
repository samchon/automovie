/**
 * The first surface selected by a skin-drawing material region, with its ordinal in the basis's surface list. Selection does not itself prove uniqueness or connectedness of that surface.
 *
 * @evidence contracts/common.md#principled-implementation A selected surface remains paired with its original basis ordinal, allowing later posed-surface reads to use the same source index.
 * @evidence contracts/common.md#clear-and-simple-design The generic surface type preserves the caller's basis structure without duplicating face and body selector result types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type stores the actual selected surface rather than a copied mesh reshaped to match an expected skin.
 * @evidence contracts/common.md#meaningful-documentation The declaration states original basis ordinal, first-match selection and the absence of a uniqueness or connectedness certificate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generic selected surface and original basis ordinal are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the generic selected surface and original basis ordinal; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring generic selected surface and original basis ordinal acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinSurface<T> {
  /** Ordinal of the skin surface in the basis's surface list. */
  index: number;

  /** The skin surface. */
  surface: T;
}
