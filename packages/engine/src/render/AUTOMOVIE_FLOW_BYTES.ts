/**
 * Device bytes of one vertex's free-surface flow vector: two 32-bit floats.
 *
 * A drawn water surface carries this attribute beside position, normal and
 * texture coordinate, and a ripple shader scrolls along it. Leaving it out
 * would understate the one buffer a pond has that a wall does not.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the water-only flow attribute in geometry memory instead of undercounting simulated surfaces.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the explicit free-surface flow stride for worst-case preflight accounting.
 */
export const AUTOMOVIE_FLOW_BYTES = 8;
