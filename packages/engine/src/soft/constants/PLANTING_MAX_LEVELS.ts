/**
 * Recursion depth one planting recipe may declare.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Bounds recursive planting derivation before it executes.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Defines the supported depth of an interior planting recipe.
 */
export const PLANTING_MAX_LEVELS = 12;
