import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Append the captured cut's affine edge samples to original positions in their existing metre frame. Neutral compilation and already-posed body fields share the same endpoint stencil. Interpolating performed endpoints preserves their represented straight triangle edge; interpolating rest points/weights before nonlinear skinning can yield another point. Input rows and captured cut must be admitted/aligned and unchanged; this gatherer adds no independent finite/index admission. Output is owned and original numbering survives.
 *
 * @evidence contracts/common.md#principled-implementation Existing source endpoints and captured strict crossing fractions produce actual affine position samples in traversal order.
 * @evidence contracts/common.md#clear-and-simple-design Cut construction owns crossing admission and topology; this reader only gathers positions for neutral or already-performed fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performed endpoints are not reskinned through an interpolated rig point, and appended coordinates alone do not invent registered physical lineage or global validity.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, represented triangle-edge meaning, admitted alignment and owned output/captured-cut lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Copying N source coordinates and appending three coordinates for each I intersection costs O(N+I) without triangle or nearest-surface searches.
 * @evidence contracts/performance.md#reuse-equivalent-work Neutral and posed consumers reuse the same admitted crossing fractions rather than recomputing signs or intersections from deformed geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned extended coordinate array escapes; no source mesh, callback task or render resource is retained.
 */
export function evaluateHumanPersonCut(
  positions: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): number[] {
  return [
    ...positions,
    ...cut.intersections.flatMap(
      ({ a, b, t }: (typeof cut.intersections)[number]): number[] =>
        [0, 1, 2].map(
          (axis: number): number =>
            (1 - t) * positions[a * 3 + axis] + t * positions[b * 3 + axis],
        ),
    ),
  ];
}
