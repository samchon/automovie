import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct and prepare entries share one normalized-direction turn core, so analytic/iterative callers and repeated two-bone aims have one scaling/collinearity owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact zero sine alone selects collinearity; prepare snapshots only one normalized source and still normalizes every target through the same core, with no new threshold or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation States finite-input premises, shortest-arc/collinear conventions and precision limits; prepare's child documents owned source snapshot, later source mutation behavior and fresh target results.
 * @evidence contracts/development/implementation.md#efficient-algorithms The direct path normalizes two directions; prepare normalizes its source once and omits that work/allocation per target, retaining constant cross/dot/atan2/axis-angle work and no measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both angle coordinates share normalized directions; prepare additionally owns a normalized source snapshot independent of later caller edits. No target, angle, quaternion result or object-identity key is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct direction/cross/result records are call-local. One prepared closure owns one normalized vector until caller release; each target/output remains local with no global state, history or handles.
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
   * The direct normalization is target-independent, so its completed vector
   * serves the same cross/dot/atan2 and axis-angle core for every separately
   * normalized target. Setup and each query use constant work; one closure
   * owns the source vector until caller release. No prior target, angle or
   * quaternion is retained, and direct calls keep live source normalization.
   */
  export function prepare(
    source: IAutoMovieVector3,
  ): (target: IAutoMovieVector3) => IAutoMovieQuaternion {
    const from: IAutoMovieVector3 = Vector3.normalize(source);
    return (target: IAutoMovieVector3): IAutoMovieQuaternion =>
      turn(from, Vector3.normalize(target));
  }
}
