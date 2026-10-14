import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Move each retained body-loop vertex to its captured nearest face-edge coordinate, then apply the interpolated loop delta to the recorded body band with its recorded weight. Inputs and correspondence must be admitted/aligned in one metre frame. Output positions are owned; input arrays remain unchanged.
 *
 * Target minus the body's own evaluated boundary is the delta. The seam owner gives boundary records weight one with fixed boundary indices and constructs its smooth interior fade; this consumer uses those records directly rather than recomputing angular proximity. Unequal partitions can span face corners with body chords, so downstream boundary subdivision is still needed for the common sample union.
 *
 * A large boundary mismatch can compress/fold the transition. This additive scatter supplies no universal gap, collision, volume or manifold guarantee and no current visual observation of the affected collar.
 *
 * @evidence contracts/common.md#principled-implementation Captured face-edge follow coordinates and actual posed body boundary produce the metre delta applied by the seam's own interpolation/fade records.
 * @evidence contracts/common.md#clear-and-simple-design Correspondence/fade construction stays with the seam owner and common boundary subdivision stays downstream; this adapter only gathers deltas and scatters positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source indices are not replaced by coordinate welding, and a boundary-on-polyline result is not declared globally gap-free, embedded or volume-preserving under arbitrary documents.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, admitted alignment, fixed boundary records, owned output and large-mismatch limitations.
 * @evidence contracts/performance.md#efficient-algorithms B boundary deltas and K band records add O(B+K) work after copying N body coordinates; no nearest-edge search repeats during evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured follow/band correspondence is reused for the current posed positions without rebuilding reach, angular lookup or nearest-edge matches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One copied coordinate buffer escapes and boundary deltas are local; no source mesh, callback task or render resource is acquired.
 */
export function conformHumanPersonCollar(props: {
  seam: IAutoMovieHumanPersonSeam;
  /** The face skin surface's evaluated positions, in the shared frame. */
  face: readonly number[];
  /** The body skin surface's evaluated positions. */
  body: readonly number[];
}): number[] {
  const { seam, face, body }: typeof props = props;
  const delta: number[][] = seam.bodyLoop.map(
    (vertex: number, j: number): number[] => {
      const { edge, fraction }: (typeof seam.collar.follow)[number] =
        seam.collar.follow[j];
      const a: number = seam.faceLoop[edge];
      const b: number = seam.faceLoop[(edge + 1) % seam.faceLoop.length];
      return [0, 1, 2].map(
        (axis: number): number =>
          face[a * 3 + axis] * (1 - fraction) +
          face[b * 3 + axis] * fraction -
          body[vertex * 3 + axis],
      );
    },
  );
  const output: number[] = body.slice();
  for (const { vertex, low, high, along, weight } of seam.collar.band)
    for (let axis: number = 0; axis < 3; axis++)
      output[vertex * 3 + axis] +=
        weight * (delta[low][axis] * (1 - along) + delta[high][axis] * along);
  return output;
}
