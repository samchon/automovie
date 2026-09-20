/**
 * Device bytes of one texture coordinate pair: two 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the texture-coordinate component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed UV stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_UV_BYTES = 8;
