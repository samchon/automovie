/**
 * One reversible semantic installation with scene-graph coverage metadata.
 * Painted and unaddressed count Mesh objects, not visible pixels; unresolved
 * names absent drawable roots. Restoration owns its original
 * scene/material/color snapshot and created materials, with sticky failure
 * rather than a successful repeated no-op.
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
   * canonical producer's ascending order). Ownership-only entries do not need a
   * drawable of their own. Empty establishes root membership rather than
   * proving visibility, submission or any actual pixel.
   */
  unresolved: string[];

  /**
   * Attempt original state and created-material retirement independently once.
   * Failed restoration remains observable on repeat; external temporary
   * instanceColor native storage has no public per-attribute disposer here.
   */
  restore: () => void;
}
