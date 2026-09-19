/**
 * Device bytes of one vertex normal: three 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the normal-buffer component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed normal stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_NORMAL_BYTES = 12;
