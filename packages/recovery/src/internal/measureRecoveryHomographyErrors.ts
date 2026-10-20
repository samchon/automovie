import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

/**
 * Measure the root-mean-square forward/backward homography transfer in pixels.
 * A mapped point on the projective horizon or an unrepresentable transfer is
 * null, which never counts as finite support for the planar competitor.
 *
 * @evidence contracts/common.md#principled-implementation Each map acts on the corresponding homogeneous pixel centre; after its nonzero divide, the two Euclidean transfer distances enter a symmetric RMS. This tests the fitted 2D map without assigning material depth.
 * @evidence contracts/common.md#clear-and-simple-design The homography owner supplies one admitted map and inverse; this helper only scores their bidirectional explanation of the same tentative correspondences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No denominator floor, omitted backward direction, finite replacement for a horizon or image-dependent threshold improves support.
 * @evidence contracts/common.md#meaningful-documentation Defines pixel-centre maps, RMS convention, null horizon/range meaning and absence of depth authority; malformed matrix actions throw.
 * @evidence contracts/performance.md#efficient-algorithms N pairs require O(N) fixed-size actions and O(N) scalar results, with no inverse fit or factorization inside the loop.
 * @evidence contracts/performance.md#reuse-equivalent-work The fitted inverse is reused for every pair rather than recomputed during transfer measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned nullable scalar results transfer to the caller; no point, map cache, image or external handle survives the synchronous call.
 */
export function measureRecoveryHomographyErrors(
  model: { matrix: readonly number[]; inverse: readonly number[] },
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
): (number | null)[] {
  if (first.length !== second.length)
    throw new Error("camera-homography: paired transfer points required");
  return first.map(
    (point: readonly [number, number], at: number): number | null => {
      const other: readonly [number, number] = second[at]!;
      const forward: [number, number, number] = AutoMovieMatrix3.apply(
        model.matrix,
        [...point, 1],
      );
      const backward: [number, number, number] = AutoMovieMatrix3.apply(
        model.inverse,
        [...other, 1],
      );
      if (forward[2] === 0 || backward[2] === 0) return null;
      const distance: number =
        Math.hypot(
          forward[0] / forward[2] - other[0],
          forward[1] / forward[2] - other[1],
          backward[0] / backward[2] - point[0],
          backward[1] / backward[2] - point[1],
        ) / Math.SQRT2;
      return Number.isFinite(distance) ? distance : null;
    },
  );
}
