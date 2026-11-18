import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./constants/QUATERNION_NLERP_DOT_THRESHOLD";
import { quaternionNormalizationDivisor } from "./quaternionNormalizationDivisor";
import { readNormalizedQuaternion } from "./readNormalizedQuaternion";

/**
 * Prepare the spatial angular derivative of Quaternion.prepareSlerp's curve.
 *
 * Endpoints are copied once and must be the same unit rotations as the actual
 * interpolation's unchanged pair. The returned reader takes dimensionless
 * progress and progress per second, including finite extrapolation, and
 * returns radians per second in the endpoints' common destination frame.
 * Endpoint edits after construction do not change this owned derivative.
 * Nonfinite/zero endpoints, unavailable arc arithmetic, a zero interpolant
 * or unrepresentable derivative return undefined for the caller's fallback.
 * This derivative certifies neither IK nor a different quaternion sampler.
 *
 * The same shorter-arc sign and strict shared NLERP threshold are retained.
 * Both branches differentiate the actual unnormalized weighted quaternion r.
 * For q=r/|r|, the radial normalization term contributes no vector component
 * to qdot*conj(q), giving omega=2*vec(rdot*conj(r))/|r|^2. Thus NLERP keeps
 * its varying angular speed; no constant geodesic rate replaces that branch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines copied fixed unit endpoints, dimensionless progress and per-second rate, common-frame spatial radians per second, extrapolation, fresh output ownership and explicit unavailable cases. It identifies the exact Quaternion.prepareSlerp policy being differentiated and excludes arbitrary samplers/IK provenance.
 * @evidence contracts/development/implementation.md#principled-implementation Differentiates Shoemake's actual sine weights or the native linear weights after the same endpoint-dot shorter-arc choice and QUATERNION_NLERP_DOT_THRESHOLD comparison. The normalization derivative's radial term vanishes in the vector of qdot*conj(q); the shared normalization divisor and actual scalar normalizer supply the same normalized weighted quaternion without assuming unit weighted sums. Finite/nonzero admission refuses undefined normalization and unrepresentable derivatives.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns the eight endpoint coordinates and fixed arc scalars. Each read forms the actual branch's weighted components and analytic derivatives, then the existing scalar normalization owner calls one static spatial-rate visitor. There is no alternate quaternion interpolator or finite-difference sampling.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the existing strict branch boundary, sign choice and actual linear/sine expressions, without progress clipping, endpoint normalization, a constant-spin override, guessed missing rates, sampler replacement, scene switches or tuned physical tolerance. Zero/nonfinite weighted norms return unavailable instead of adopting the sampler's identity repair as a derivative.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed preparation and each progress read take constant time and storage. One shared scalar normalization plus a fixed quaternion tangent product supplies the output; no pose, Jacobian, history or sampled endpoint differences are computed. Runtime gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Copied endpoint coordinates fix one curve epoch; their exact dot/sign and spherical theta/sine are shared across reads. Every progress and rate still computes its own weights, weighted quaternion, normalization and derivative, with no target/time/result memo.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure retains only a fixed set of copied endpoint/arc scalars until its owner releases it. Each call owns one constant-size tangent context and a fresh output vector or undefined; no endpoint objects, callbacks, query population, process or resource handle is retained.
 */
export function prepareQuaternionSlerpRate(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): (share: number, shareRate: number) => IAutoMovieVector3 | undefined {
  const ax: number = a.x;
  const ay: number = a.y;
  const az: number = a.z;
  const aw: number = a.w;
  let bx: number = b.x;
  let by: number = b.y;
  let bz: number = b.z;
  let bw: number = b.w;
  let cosine: number = ax * bx + ay * by + az * bz + aw * bw;
  if (cosine < 0) {
    cosine = -cosine;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  const linear: boolean = cosine > QUATERNION_NLERP_DOT_THRESHOLD;
  const theta: number = linear ? 0 : Math.acos(cosine);
  const sine: number = linear ? 1 : Math.sin(theta);
  const admitted: boolean = [ax, ay, az, aw, bx, by, bz, bw, cosine, theta, sine].every(Number.isFinite) &&
    Math.hypot(ax, ay, az, aw) > 0 && Math.hypot(bx, by, bz, bw) > 0 && sine !== 0;

  return (share: number, shareRate: number): IAutoMovieVector3 | undefined => {
    if (!admitted || !Number.isFinite(share) || !Number.isFinite(shareRate)) return undefined;
    const wa: number = linear ? 1 - share : Math.sin((1 - share) * theta) / sine;
    const wb: number = linear ? share : Math.sin(share * theta) / sine;
    const da: number = linear ? -shareRate : -theta * Math.cos((1 - share) * theta) / sine * shareRate;
    const db: number = linear ? shareRate : theta * Math.cos(share * theta) / sine * shareRate;

    // Preserve the native linear branch's a+(b-a)*share expression, rather
    // than reassociating it into the spherical branch's weighted sum.
    const x: number = linear ? ax + (bx - ax) * share : ax * wa + bx * wb;
    const y: number = linear ? ay + (by - ay) * share : ay * wa + by * wb;
    const z: number = linear ? az + (bz - az) * share : az * wa + bz * wb;
    const w: number = linear ? aw + (bw - aw) * share : aw * wa + bw * wb;
    const dx: number = linear ? (bx - ax) * shareRate : ax * da + bx * db;
    const dy: number = linear ? (by - ay) * shareRate : ay * da + by * db;
    const dz: number = linear ? (bz - az) * shareRate : az * da + bz * db;
    const dw: number = linear ? (bw - aw) * shareRate : aw * da + bw * db;
    if (![x, y, z, w, dx, dy, dz, dw].every(Number.isFinite)) return undefined;

    // Scale r and rdot by the same native divisor. The scale cancels in
    // rdot/|r|, including the normalizer's extreme-component policy.
    const divisor: number = quaternionNormalizationDivisor(x, y, z, w);
    const sx: number = x / divisor;
    const sy: number = y / divisor;
    const sz: number = z / divisor;
    const sw: number = w / divisor;
    const length: number = Math.sqrt(sx * sx + sy * sy + sz * sz + sw * sw);
    if (!(Number.isFinite(length) && length > 0)) return undefined;
    const tangent: ITangent = {
      x: dx / divisor / length,
      y: dy / divisor / length,
      z: dz / divisor / length,
      w: dw / divisor / length,
    };
    if (![tangent.x, tangent.y, tangent.z, tangent.w].every(Number.isFinite) ||
        (dx !== 0 && tangent.x === 0) || (dy !== 0 && tangent.y === 0) ||
        (dz !== 0 && tangent.z === 0) || (dw !== 0 && tangent.w === 0)) return undefined;
    return readNormalizedQuaternion.fromScalars(x, y, z, w, spatial, tangent);
  };
}

/** The weighted quaternion's derivative divided by its current raw norm. */
interface ITangent {
  /** X tangent component per second. */
  x: number;
  /** Y tangent component per second. */
  y: number;
  /** Z tangent component per second. */
  z: number;
  /** W tangent component per second. */
  w: number;
}

/** Twice vec((rdot/|r|)*conj(q)); the omitted radial term is purely real. */
function spatial(x: number, y: number, z: number, w: number, tangent: ITangent): IAutoMovieVector3 | undefined {
  const angular: IAutoMovieVector3 = {
    x: 2 * (-tangent.w * x + tangent.x * w - tangent.y * z + tangent.z * y),
    y: 2 * (-tangent.w * y + tangent.x * z + tangent.y * w - tangent.z * x),
    z: 2 * (-tangent.w * z - tangent.x * y + tangent.y * x + tangent.z * w),
  };
  return [angular.x, angular.y, angular.z].every(Number.isFinite) ? angular : undefined;
}
