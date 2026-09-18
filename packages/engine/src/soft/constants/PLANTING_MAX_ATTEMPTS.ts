/**
 * Seeded placement attempts one member may cost.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Bounds rejection sampling for every cluster member.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Defines the maximum placement work per member.
 */
export const PLANTING_MAX_ATTEMPTS = 64;
