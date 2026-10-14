/**
 * One reversible semantic installation with scene-graph coverage metadata. Painted and unaddressed count Mesh objects, not visible pixels; unresolved names absent drawable roots. Restoration owns its original scene/material/color snapshot and created materials, with sticky failure rather than a successful repeated no-op.
 *
 * @evidence contracts/common.md#principled-implementation Reports mapper mesh classification counts and unresolved drawable root ids while retaining one owned reversible pass restoration.
 * @evidence contracts/common.md#clear-and-simple-design Coverage metadata and its restore owner travel together without claiming a renderer submission or pixel readback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hidden/frustum-culled meshes are still counted in the scene graph and an empty unresolved list proves root membership only; failed restore stays observable and not retried as a successful no-op.
 * @evidence contracts/common.md#meaningful-documentation Documents mesh-count units, unclaimed background, unresolved root order and synchronous one-attempt restoration plus native attribute-lifetime limits.
 * @evidence contracts/performance.md#efficient-algorithms The handle holds fixed counts, unresolved-id references and the mapper closer; traversal/color/material costs remain attributed to the owning installation.
 * @evidence contracts/performance.md#reuse-equivalent-work One installed pass shares its original restore attempt/outcome, while another scene/pass must acquire an independent snapshot and resource owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closer retains originals, created materials and copied instance colors until the handle is unreachable; it attempts their supported restoration/disposal and cannot independently retire an externally-created temporary instanceColor native buffer.
 *
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskHandle {
  /**
   * Mesh objects assigned an addressed semantic material during installation,
   * including hidden geometry; this is not a visible-pixel count.
   */
  painted: number;

  /**
   * Meshes left at the reserved background colour because no entry claimed
   * them. Never silently zero: unaddressed geometry in a segmentation pass is a
   * hole in the evidence, and it is counted so a consumer can refuse it.
   */
  unaddressed: number;

  /**
   * Drawable ids with no resolved scene object root, in palette order (the
   * canonical producer's ascending order). Ownership-only entries do not need
   * a drawable of their own. Empty establishes root membership rather than
   * proving visibility, submission or any actual pixel.
   */
  unresolved: string[];

  /**
   * Attempt original state and created-material retirement independently once.
   * Failed restoration remains observable on repeat; external temporary
   * instanceColor native storage has no public per-attribute disposer here.
   *
   * @evidence contracts/common.md#principled-implementation Independently attempts original material/color/scene restoration and distinct created-material retirement under one sticky synchronous guard.
   * @evidence contracts/common.md#clear-and-simple-design The handle exposes one teardown responsibility while mapper collections own the complete restoration population.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed listener cannot skip neighboring owners and repeated failure preserves its original cause; public disposal is not physical GPU release proof.
   * @evidence contracts/common.md#meaningful-documentation Documents complete supported state withdrawal, one attempt and uncertainty of temporary external-host instance-color native storage.
   * @evidence contracts/performance.md#efficient-algorithms Restoration cost scales with swapped meshes, copied color components, created materials and hidden renderables; the guard incurs that work once.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated/reentrant calls represent the same installation and share its attempt; another installed pass is not reused by equal coverage counts.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed materials/scene return to their original state where supported and created materials are attempted independently; failed state/resource ownership remains explicit through the retained handle cause.
   */
  restore: () => void;
}
