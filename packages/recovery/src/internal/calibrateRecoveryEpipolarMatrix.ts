import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { Vector3 } from "@automovie/engine/math/Vector3";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Project a pixel fundamental matrix onto the supplied-calibration essential
 * manifold and return all four relative-pose candidates. Arrays are row-major;
 * each candidate maps first-camera coordinates to second-camera coordinates.
 * Translation has unit norm and carries no physical length measurement.
 * The equal-singular projection and four-pose ambiguity follow HZ chapter 9:
 * https://www.robots.ox.ac.uk/~vgg/hzbook/hzbook2/HZepipolar.pdf
 *
 * @evidence contracts/common.md#principled-implementation Original 3-by-3 SVD of K2-transpose F K1 supplies two essential directions. Equal unit singulars impose calibration, cross products complete proper orthonormal frames, and the two quarter-turn compositions with both translation signs retain every pose ambiguity for later cheirality.
 * @evidence contracts/common.md#clear-and-simple-design This recovery helper owns the calibrated projection while generic decomposition, cross products and row-major composition remain in engine. It does not choose a pose or certify image residuals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truth orientation, minimum singular floor, zero third left singular vector or forced cheirality chooses a camera. Rank-deficient and nonrepresentable decompositions throw.
 * @evidence contracts/common.md#meaningful-documentation States coordinate direction, row order, unit-baseline gauge, four unresolved candidates, primary method and relative projection discrepancy.
 * @evidence contracts/performance.md#efficient-algorithms One bounded 3-by-3 SVD and fixed-size products cost O(S) time and constant storage independent of image size.
 * @evidence contracts/performance.md#reuse-equivalent-work The same factorization supplies essential projection, discrepancy and all four poses; neither pixel matrix nor calibration is decomposed again for each sign.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local factors expire on return or throw; only owned fixed-size matrices, translations and a scalar discrepancy escape, with no cache or handle.
 */
export function calibrateRecoveryEpipolarMatrix(
  fundamental: readonly number[],
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
  maxSweeps: number,
): {
  essential: number[];
  fundamental: number[];
  relativeProjectionDiscrepancy: number;
  poses: { rotation: number[]; translation: [number, number, number] }[];
} {
  const raw: number[] = AutoMovieMatrix3.multiply(AutoMovieMatrix3.transpose(second.matrix),
    AutoMovieMatrix3.multiply(fundamental, first.matrix));
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> = decomposeAutoMovieSingularMatrix(
    [raw.slice(0, 3), raw.slice(3, 6), raw.slice(6, 9)],
    { maxEntries: 9, maxSweeps, orthogonalityTolerance: 1e-12 },
  );
  const largest: number = factors.singularValues[0]!;
  const ratio: number = factors.singularValues[1]! / largest;
  if (!(ratio > factors.relativeNullCutoff) || !Number.isFinite(ratio))
    throw new Error("camera-essential: two resolved directions required");
  const frames: number[][] = [];
  for (const columns of [factors.leftColumns, factors.rightColumns]) {
    const a: number[] = columns[0]!;
    const b: number[] = columns[1]!;
    const cross: IAutoMovieVector3 = Vector3.cross(
      { x: a[0]!, y: a[1]!, z: a[2]! }, { x: b[0]!, y: b[1]!, z: b[2]! },
    );
    const length: number = Math.hypot(cross.x, cross.y, cross.z);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error("camera-essential: unresolved orientation frame");
    frames.push([a[0]!, b[0]!, cross.x / length, a[1]!, b[1]!, cross.y / length,
      a[2]!, b[2]!, cross.z / length]);
  }
  const u: number[] = frames[0]!;
  const vt: number[] = AutoMovieMatrix3.transpose(frames[1]!);
  const essential: number[] = AutoMovieMatrix3.multiply(u,
    AutoMovieMatrix3.multiply([1, 0, 0, 0, 1, 0, 0, 0, 0], vt));
  const pixel: number[] = AutoMovieMatrix3.multiply(AutoMovieMatrix3.transpose(second.inverse),
    AutoMovieMatrix3.multiply(essential, first.inverse));
  const pixelNorm: number = Math.hypot(...pixel);
  if (!(pixelNorm > 0) || !Number.isFinite(pixelNorm))
    throw new Error("camera-essential: nonrepresentable calibrated pixel matrix");
  const meanRatio: number = (1 + ratio) / 2;
  const thirdRatio: number = factors.singularValues[2]! / largest;
  const relativeProjectionDiscrepancy: number = Math.hypot(1 - meanRatio, ratio - meanRatio, thirdRatio) /
    Math.hypot(1, ratio, thirdRatio);
  const poses: { rotation: number[]; translation: [number, number, number] }[] = [];
  const w: number[] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  for (const quarterTurn of [w, AutoMovieMatrix3.transpose(w)]) {
    const rotation: number[] = AutoMovieMatrix3.multiply(u, AutoMovieMatrix3.multiply(quarterTurn, vt));
    for (const sign of [1, -1]) poses.push({ rotation: rotation.slice(),
      translation: [sign * u[2]!, sign * u[5]!, sign * u[8]!] });
  }
  return { essential, fundamental: pixel.map((value: number): number => value / pixelNorm),
    relativeProjectionDiscrepancy, poses };
}
