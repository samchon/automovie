import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
/**
 * Shortest-arc rotation from finite vector `a` to finite vector `b`, using
 * atan2 without a near-parallel identity deadzone. Iterative world-driver IK
 * and analytic two-bone aiming share this direction and collinearity convention.
 *
 * The predecessor (`quatFromTo`) snapped `cos > 0.999999` to the identity,
 * which put a ~1.9e-3 m convergence floor under the iterative IK solvers and
 * made the aim/reach path ignore its last ~0.08°. Sub-0.1° corrections are
 * the moves a late solver sweep, a foot plant, or a slow camera track needs.
 * Representable nonzero cross products stay active, subject to binary64
 * precision in normalization and quaternion conversion (#643).
 *
 * Both inputs are normalized before computing sine and cosine, avoiding
 * overflow from their original magnitudes. The cross-product axis is normalized
 * by `fromAxisAngle`. Callers needing named finite-input refusal validate first
 * (see `aimRotation`). A degenerate
 * input (zero vector, exact parallel) degrades to the identity; exact
 * antiparallel takes a deterministic 180° flip about a perpendicular (the
 * `|a.x| < 0.9` axis split).
 *
 * @evidence contracts/common.md#principled-implementation Normalized directions supply cross-product sine and dot-product cosine to atan2 for a shortest arc; exact collinearity selects identity or a deterministic perpendicular half-turn without an angular deadzone.
 * @evidence contracts/common.md#clear-and-simple-design Analytic aiming and iterative world-driver paths share this primitive, giving direction scaling and antiparallel conventions one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only exact zero sine selects collinear branches, so small representable turns remain active; zero vectors follow the declared identity convention.
 * @evidence contracts/common.md#meaningful-documentation States finite direction magnitudes, shortest-arc construction, zero/parallel identity, deterministic antiparallel axis and binary64 precision limits.
 * @evidence contracts/performance.md#efficient-algorithms Two normalizations, one cross/dot pair and one axis-angle conversion take constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Both angle coordinates reuse the normalized directions during the call; changing the target invalidates any prior turn.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Direction, cross/perpendicular and result records are bounded call-local values; no mesh, rig or driver state is retained.
 * @author Samchon
 */
export const rotationBetween: (a: IAutoMovieVector3, b: IAutoMovieVector3) => IAutoMovieQuaternion = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const from: IAutoMovieVector3 = Vector3.normalize(a);
  const to: IAutoMovieVector3 = Vector3.normalize(b);
  const cross: IAutoMovieVector3 = Vector3.cross(from, to);
  const sin: number = Vector3.length(cross);
  const cos: number = Vector3.dot(from, to);
  if (sin === 0) {
    if (cos >= 0) return Quaternion.identity();
    const perp: IAutoMovieVector3 =
      Math.abs(from.x) < 0.9
        ? Vector3.cross(from, { x: 1, y: 0, z: 0 })
        : Vector3.cross(from, { x: 0, y: 1, z: 0 });
    return Quaternion.fromAxisAngle(perp, 180);
  }
  return Quaternion.fromAxisAngle(
    cross,
    (Math.atan2(sin, cos) * 180) / Math.PI,
  );
};
