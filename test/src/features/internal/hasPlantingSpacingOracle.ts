/**
 * Independently verify every spacing-relevant pair by an x-sorted sweep.
 * A pair whose x-gap is at least the nonnegative minimum cannot violate its
 * Euclidean ground distance. Every other pair is measured, including points
 * separated by intervening entries in the sort. This uses neither production
 * seed/attempt logic nor its uniform-grid cells. Sorting copies the input.
 * The square-root metric retains the original exhaustive oracle's arithmetic.
 */
export const hasPlantingSpacingOracle = (
  placements: readonly { translation: { x: number; z: number } }[],
  minimum: number,
): boolean => {
  if (minimum === 0) return true;
  const ordered = [...placements].sort((left, right) =>
    left.translation.x - right.translation.x,
  );
  for (let a = 0; a < ordered.length; ++a)
    for (let b = a + 1; b < ordered.length; ++b) {
      const dx = ordered[b]!.translation.x - ordered[a]!.translation.x;
      if (dx >= minimum) break;
      const dz = ordered[b]!.translation.z - ordered[a]!.translation.z;
      if (Math.sqrt(dx * dx + dz * dz) < minimum) return false;
    }
  return true;
};
