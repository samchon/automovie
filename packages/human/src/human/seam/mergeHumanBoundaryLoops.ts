/**
 * Merge two opposite-oriented cyclic boundary populations into logical ribbon adjacency. First-loop vertex i has parameter i, with count equivalent to zero; second-loop parameters are in [0,count] and nonincreasing with at most one cyclic wrap in their given direction. Reverse walking yields increasing merge order, with the first loop advancing on ties. Local indices are first-loop 0..count-1 then count+j.
 *
 * Caller supplies a finite integral source-sized count; this function enforces only count/second length at least two and parameter range/order. It emits count+secondLength logical triangles whose loop-facing direction opposes each source edge under those premises. Collinear/wedge triangles are not final emitted surface geometry; downstream stitching subdivides actual skins onto common samples. This stencil supplies no global manifold, collision or clinical/current visual proof.
 *
 * @evidence contracts/common.md#principled-implementation Actual cyclic follow parameters determine deterministic opposite-loop adjacency and preserve first-loop tie ownership.
 * @evidence contracts/common.md#clear-and-simple-design One ordered two-pointer merge creates a logical source-index stencil while final surface subdivision remains with the stitch owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range/noncyclic parameters refuse instead of guessed joins, and logical degenerate adjacency is not exported or certified as global manifold geometry.
 * @evidence contracts/common.md#meaningful-documentation Prose states dimensionless edge coordinates, count admission premise, cyclic equivalence, tie policy and logical/final surface distinction.
 * @evidence contracts/performance.md#efficient-algorithms Finding the cyclic start and merging source populations costs O(first count+second count), without geometry projection or sorting each triangle.
 * @evidence contracts/performance.md#reuse-equivalent-work One cyclic order/position table serves the complete merge, and the resulting stencil is reused by seam consumers until source correspondence changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned indices scale with the two boundary counts, while order/position workspace is local and no geometry, asset task or renderer is retained.
 */
export function mergeHumanBoundaryLoops(
  count: number,
  parameters: readonly number[],
): number[] {
  const m: number = parameters.length;
  if (count < 2 || m < 2)
    throw new Error("A ribbon needs two loops of at least two vertices.");
  // the second loop walked backwards, as indices into it
  const walk: number[] = parameters.map(
    (_: number, k: number): number => m - 1 - k,
  );
  const along: number[] = walk.map((j: number): number => parameters[j]);
  let descents: number = 0;
  let start: number = 0;
  for (let k: number = 0; k < m; k++)
    if (along[k] < along[(k + m - 1) % m]) {
      descents++;
      start = k;
    }
  if (
    descents > 1 ||
    along.some((value: number): boolean => !(value >= 0 && value <= count))
  )
    throw new Error("The second loop does not run along the first in order.");
  const order: number[] = walk.map(
    (_: number, b: number): number => walk[(start + b) % m],
  );
  const position: number[] = order.map((j: number): number => parameters[j]);
  const first: number = Math.min(Math.floor(position[0]), count - 1);
  const indices: number[] = [];
  let faceDone: number = 0;
  let bodyDone: number = 0;
  while (faceDone < count || bodyDone < m) {
    const face: number = (first + faceDone) % count;
    const nextFace: number = (first + faceDone + 1) % count;
    const nextPosition: number =
      bodyDone >= m
        ? Infinity
        : bodyDone + 1 < m
          ? position[bodyDone + 1]
          : position[0] + count;
    if (
      bodyDone >= m ||
      (faceDone < count && first + faceDone + 1 <= nextPosition)
    ) {
      indices.push(nextFace, face, count + order[bodyDone % m]);
      faceDone++;
    } else {
      indices.push(
        count + order[bodyDone % m],
        count + order[(bodyDone + 1) % m],
        face,
      );
      bodyDone++;
    }
  }
  return indices;
}
