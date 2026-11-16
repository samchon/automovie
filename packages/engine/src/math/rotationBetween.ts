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
 * @evidence contracts/development/implementation.md#principled-implementation Normalized directions supply cross-product sine and dot-product cosine to atan2 for a shortest arc; exact collinearity selects identity or a deterministic perpendicular half-turn without an angular deadzone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Analytic aiming and iterative world-driver paths share this primitive, giving direction scaling and antiparallel conventions one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only exact zero sine selects collinear branches, so small representable turns remain active; zero vectors follow the declared identity convention.
 * @evidence contracts/development/common.md#meaningful-documentation States finite direction magnitudes, shortest-arc construction, zero/parallel identity, deterministic antiparallel axis and binary64 precision limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two normalizations, one cross/dot pair and one axis-angle conversion take constant work and storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both angle coordinates reuse the normalized directions during the call; changing the target invalidates any prior turn.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direction, cross/perpendicular and result records are bounded call-local values; no mesh, rig or driver state is retained.
 */
export function rotationBetween(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const from: IAutoMovieVector3 = Vector3.normalize(a);
  const to: IAutoMovieVector3 = Vector3.normalize(b);
  return turn(from, to);
}

/** Exact normalized-direction core, shared by ordinary and fixed-source turns. */
function turn(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
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
}

/**
 * Fixed-source shortest-arc preparation for repeated target directions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates one owned normalized source snapshot from changing target directions and fresh quaternion outputs.
 * @evidence contracts/development/design.md#principled-representation A shortest arc depends only on normalized directions; normalizing one unchanged source once preserves the direct turn's actual arithmetic and collinear convention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface aimRotation.prepare consumes the source reader for upper and lower two-bone candidate aims; no axis, angle or target-result cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The direct path keeps live source normalization and the same shared turn core; prepared construction snapshots only one normalized vector and adds no deadzone or alternate fallback.
 */
export namespace rotationBetween {
  /**
   * Normalize and own one source direction, then compute every requested
   * target's shortest arc through the direct function's same core. The
   * caller supplies finite vectors as in the direct entry; named finite
   * refusal belongs to aimRotation. Changing the original source afterward
   * does not alter this explicit snapshot. Zero/parallel/antiparallel inputs
   * retain the direct identity/perpendicular convention.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States finite-input premises, explicit normalized source ownership, unchanged collinear behavior and fresh result meaning.
   * @evidence contracts/development/implementation.md#principled-implementation The direct source normalization is independent of target, so its completed result serves the same cross/dot/atan2 and axis-angle core for every separately normalized target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared turn core prevents prepared and direct shortest-arc formulas or degeneracy policy from drifting.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new angular or magnitude threshold is introduced; each target still runs the actual normalized-direction solve and quaternion construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup normalizes one source; each query omits that repeated normalization/allocation and retains target normalization and constant cross/dot/axis-angle work. Runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the owned normalized source snapshot is shared, not a prior target, angle, quaternion or caller object identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One returned closure owns one normalized vector until caller release; every target/output is call-local and no history, global state or handles exist.
   */
  export function prepare(
    source: IAutoMovieVector3,
  ): (target: IAutoMovieVector3) => IAutoMovieQuaternion {
    const from: IAutoMovieVector3 = Vector3.normalize(source);
    return (target: IAutoMovieVector3): IAutoMovieQuaternion =>
      turn(from, Vector3.normalize(target));
  }
}
