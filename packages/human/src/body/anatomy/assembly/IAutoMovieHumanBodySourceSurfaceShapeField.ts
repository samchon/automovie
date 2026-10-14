/**
 * Offline source deformation over one actual anatomical boundary member.
 *
 * @evidence contracts/common.md#principled-implementation An exact source member ID aligns neutral-metre displacement triples with native vertices and preserves declared attachment ordinals at zero displacement.
 * @evidence contracts/common.md#clear-and-simple-design A per-member field keeps geometry correspondence separate from the part-level coefficient interval and provenance account.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Correspondence follows native source ordinals rather than material labels, bounding boxes or independently fitted geometry.
 * @evidence contracts/common.md#meaningful-documentation Member comments give exact identity, triple units/alignment and the meaning of held attachment ordinals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The member field is deformation input and performs no vertex traversal or coefficient solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Aligned displacements describe source correspondence without retaining completed deformed meshes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly displacement/ordinal arrays remain source data and this interface creates no resident allocation owner.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceSurfaceShapeField {
  /** Exact SourcePart surface member ID; no material or bbox correspondence. */
  member: string;

  /** Common-neutral metre displacement triples, aligned with native source vertices. */
  displacements: readonly number[];

  /** Source attachment boundary ordinals held exactly by zero displacement. */
  heldVertices: readonly number[];
}
