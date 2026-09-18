/**
 * Device bytes of one vertex position: three 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the position-buffer component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed position stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_POSITION_BYTES = 12;
