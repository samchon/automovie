/**
 * Shared plumbing for the world-space driver passes ({@link resolveWorldDrivers}
 * and the iterative IK solvers): world/local lookups that fail loudly, the
 * subtree recompose walk, and the small quaternion/vector blends every solver
 * lowers its result through. One home so the analytic and iterative solvers
 * cannot drift apart on the basics.
 *
 * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Reads the exact world matrix on which ordered driver transforms operate.
 * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Enforces the resolved-world lookup used throughout the transform chain.
 */
export const readWorld = (
  world: Map<string, number[]>,
  id: string,
  role: string,
): number[] => {
  const matrix = world.get(id);
  if (matrix === undefined)
    throw new Error(`world driver ${role} node "${id}" was not provided`);
  return matrix;
};
