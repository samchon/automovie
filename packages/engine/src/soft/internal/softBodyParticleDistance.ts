/*
 * Measure the Euclidean distance between two particle triples in a flat
 * position array.
 */
export function softBodyParticleDistance(
  values: ArrayLike<number>,
  a: number,
  b: number,
): number {
  const dx: number = values[b * 3] - values[a * 3];
  const dy: number = values[b * 3 + 1] - values[a * 3 + 1];
  const dz: number = values[b * 3 + 2] - values[a * 3 + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
