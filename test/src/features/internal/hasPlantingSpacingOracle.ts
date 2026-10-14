/**
 * Independently verify every spacing-relevant pair by an x-sorted sweep.
 * A pair whose x-gap is at least the nonnegative minimum cannot violate its
 * Euclidean ground distance. Every other pair is measured, including points
 * separated by intervening entries in the sort. This uses neither production
 * seed/attempt logic nor its uniform-grid cells. Sorting copies the input.
 * The square-root metric retains the original exhaustive oracle's arithmetic.
 * The caller supplies finite coordinates and a nonnegative spacing; zero
 * returns true. Work is O(N log N + Q) for the Q visited pairs, quadratic for
 * an X-narrow population, with O(N) copied storage. This supporting predicate
 * runs inside test_planting_cluster_arrangement and owns no independent host.
 */
export const hasPlantingSpacingOracle: (
  placements: readonly { translation: { x: number; z: number } }[],
  minimum: number,
) => boolean = (
  placements: readonly { translation: { x: number; z: number } }[],
  minimum: number,
): boolean => {
  if (minimum === 0) return true;
  const ordered: { translation: { x: number; z: number } }[] = [
    ...placements,
  ].sort(
    (
      left: { translation: { x: number; z: number } },
      right: { translation: { x: number; z: number } },
    ): number => left.translation.x - right.translation.x,
  );
  for (let a: number = 0; a < ordered.length; ++a)
    for (let b: number = a + 1; b < ordered.length; ++b) {
      const dx: number = ordered[b]!.translation.x - ordered[a]!.translation.x;
      if (dx >= minimum) break;
      const dz: number = ordered[b]!.translation.z - ordered[a]!.translation.z;
      if (Math.sqrt(dx * dx + dz * dz) < minimum) return false;
    }
  return true;
};
