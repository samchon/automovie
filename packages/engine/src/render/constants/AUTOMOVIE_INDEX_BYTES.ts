/**
 * Device bytes of one triangle index: one 32-bit unsigned integer.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for indexed-triangle storage in geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed index stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_INDEX_BYTES = 4;
