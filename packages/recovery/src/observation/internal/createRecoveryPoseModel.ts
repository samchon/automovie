import { AutoMovieMatrix3, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieRecoveryPoseModelCreationOperation,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Pixel epipolar model and its five local calibrated-pose derivatives. Rotation
 * increments act on the left in radians; translation increments use two raw
 * directions of the admitted near-unit translation. The complete signed Sampson
 * quotient cancels the positive translation-normalization scale, so its
 * derivative uses these raw directions even when DN(t)B differs from B. No
 * camera covariance or global optimum follows.
 */
export function createRecoveryPoseModel(
  pose: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[0],
  first: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[1],
  second: Parameters<IAutoMovieRecoveryPoseModelCreationOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation> {
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
  if (!(norm > 0))
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
