/**
 * Read the largest actual displacement of an existing ordered boundary.
 * Both flat position fields address the same native vertex identities in
 * common body-frame metres. This is a Euclidean observation of the assembly
 * step, not a clearance tolerance or anatomical acceptance bound. An empty
 * boundary has zero displacement. No position field is modified.
 */
export function measureHumanBoundaryDisplacement(
  boundary: readonly number[],
  before: readonly number[],
  after: readonly number[],
): number {
  let maximum = 0;
  for (const vertex of boundary)
    maximum = Math.max(maximum, Math.hypot(
      after[3 * vertex] - before[3 * vertex],
      after[3 * vertex + 1] - before[3 * vertex + 1],
      after[3 * vertex + 2] - before[3 * vertex + 2],
    ));
  return maximum;
}
