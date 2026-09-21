/**
 * Device bytes of one RGBA8 texel.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Converts decoded RGBA8 dimensions into the texture-memory budget.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the texel stride used by texture closure accounting.
 */
export const AUTOMOVIE_TEXEL_BYTES = 4;
