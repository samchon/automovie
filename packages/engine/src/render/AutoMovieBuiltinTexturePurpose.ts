/**
 * Actual implicit material and rectangular-light texture consumer roles.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies the implementation-generated lookup resources required by supported materials and lights.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps required native lookup roles separate from ordinary authored image assets.
 */
export type AutoMovieBuiltinTexturePurpose = "subsurface-lut" | "overlay-flat-normal" | "area-ltc-1" | "area-ltc-2";
