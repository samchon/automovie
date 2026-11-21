/**
 * Maximum admitted relationship population for one coupled solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Caps the single shared request at the existing 256-relationship upper limit.
 */
export const PHYSICAL_COUPLED_RELATIONSHIP_LIMIT: number = 256;
