import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { Vector3 } from "@automovie/engine/math/Vector3";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Pixel epipolar model and its five local calibrated-pose derivatives.
 * Rotation increments act on the left in radians; translation increments use
 * two raw directions of the admitted near-unit translation. The complete signed
 * Sampson quotient cancels the positive translation-normalization scale, so its
 * derivative uses these raw directions even when DN(t)B differs from B.
 * No camera covariance or global optimum follows.
 *
 * @evidence contracts/common.md#principled-implementation F=K2-inverse-transpose [t]cross R K1-inverse. Three left SO3 generators give dR=[axis]cross R; two raw translation directions give dE=[basis]cross R. Positive-scale invariance of the full signed Sampson quotient cancels the updater's normalization. The least-aligned axis resolves two directions; exact orthonormality requires exact unit t.
 * @evidence contracts/common.md#clear-and-simple-design One local model owns calibrated parameter derivatives and passes generic matrix/cross algebra to engine; the optimizer consumes the same pixel chart for residuals and Jacobians.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite-difference step, expected camera, metric baseline or unconstrained nine-entry matrix supplies a derivative. A translation outside the admitted near-unit gauge or a nonrepresentable map throws.
 * @evidence contracts/common.md#meaningful-documentation States local coordinate units, left-update order, raw-direction and Sampson-scale meaning, calibrated F equation and absence of covariance/global-optimum authority.
 * @evidence contracts/performance.md#efficient-algorithms Six fixed-size calibrated matrices and one tangent construction require constant work and storage, independent of point count.
 * @evidence contracts/performance.md#reuse-equivalent-work The translation cross matrix and inverse-transpose calibration serve every derivative, while the returned tangent basis also drives the optimizer's matching pose update.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only six owned matrices and two tangent vectors return; call-local algebra retains no image, mutable calibration, cache or external handle.
 */
export function createRecoveryPoseModel(
  pose: {
    rotation: readonly number[];
    translation: readonly [number, number, number];
  },
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
): {
  matrix: number[];
  derivatives: number[][];
  tangent: [number, number, number][];
} {
  const t: readonly [number, number, number] = pose.translation;
  if (Math.abs(Math.hypot(...t) - 1) > 1e-10)
    throw new Error("camera-refinement: translation must have unit gauge");
  let least: number = 0;
  for (let at: number = 1; at < 3; at++)
    if (Math.abs(t[at]!) < Math.abs(t[least]!)) least = at;
  const projection: number[] = t.map(
    (value: number, at: number): number =>
      (at === least ? 1 : 0) - value * t[least]!,
  );
  const norm: number = Math.hypot(...projection);
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error("camera-refinement: unresolved tangent basis");
  const a: [number, number, number] = [
    projection[0]! / norm,
    projection[1]! / norm,
    projection[2]! / norm,
  ];
  const b: IAutoMovieVector3 = Vector3.cross(
    { x: t[0], y: t[1], z: t[2] },
    { x: a[0], y: a[1], z: a[2] },
  );
  const tangent: [number, number, number][] = [a, [b.x, b.y, b.z]];
  const tx: number[] = AutoMovieMatrix3.skew(t);
  const inverseTranspose: number[] = AutoMovieMatrix3.transpose(second.inverse);
  const essentials: number[][] = [AutoMovieMatrix3.multiply(tx, pose.rotation)];
  for (const axis of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ])
    essentials.push(
      AutoMovieMatrix3.multiply(
        tx,
        AutoMovieMatrix3.multiply(AutoMovieMatrix3.skew(axis), pose.rotation),
      ),
    );
  for (const direction of tangent)
    essentials.push(
      AutoMovieMatrix3.multiply(
        AutoMovieMatrix3.skew(direction),
        pose.rotation,
      ),
    );
  const matrices: number[][] = essentials.map((essential: number[]): number[] =>
    AutoMovieMatrix3.multiply(
      inverseTranspose,
      AutoMovieMatrix3.multiply(essential, first.inverse),
    ),
  );
  return { matrix: matrices[0]!, derivatives: matrices.slice(1), tangent };
}
