/**
 * Device bytes of one vertex's skin binding: four 16-bit joint indices and four
 * 32-bit weights, the glTF four-influence convention the mesh type documents.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes joint and weight attributes in skinned-geometry memory rather than counting only positions.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the declared four-influence stride for conservative geometry accounting.
 */
export const AUTOMOVIE_SKIN_BYTES = 24;
