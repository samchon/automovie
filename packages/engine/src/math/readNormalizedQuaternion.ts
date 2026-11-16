import type { IAutoMovieQuaternion } from "@automovie/interface";

import { quaternionNormalizationDivisor } from "./quaternionNormalizationDivisor";

/**
 * Read normalized quaternion components synchronously without a unit record.
 * The visitor receives the original normalization's X/Y/Z/W values, the raw
 * quaternion and caller context. Context transfers existing inputs without
 * constructing a per-call closure or wrapper. Zero length reads identity and
 * nonfinite propagation stays unchanged. An extreme input still creates the
 * original scaled record. The visitor owns its returned result.
 * Visitor errors propagate after normalization; nothing is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines normalized X/Y/Z/W then raw/context visitor arguments, synchronous execution, zero identity, extreme temporary scaling, nonfinite behavior, result ownership and error propagation.
 * @evidence contracts/development/implementation.md#principled-implementation Uses Quaternion.normalize's original positive rescaling, left-associated four-square norm, reciprocal and component products. The visitor receives those exact completed scalars in the same X/Y/Z/W order, so a consumer can read them without changing a normalization boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalization owner serves Quaternion.normalize's record constructor, its scalar angular distance and the projector's scalar scores. The shared divisor owns magnitude thresholds; raw/context arguments let those actual consumers reuse visitors without per-call capture or mutable pending-input bindings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unit-input shortcut, dot tolerance, alternate norm or multiplication reassociation is introduced. Zero-length identity and extreme/nonfinite branches preserve the original expressions and input-component read order; each callback runs exactly once after those computations.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size magnitude and norm work is unchanged. Ordinary scalar consumers omit one four-component quaternion allocation; the public normalizer still creates its required fresh record. Extreme inputs keep their existing temporary scaled record, and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual normalization and projector consumers share the same arithmetic owner. A caller may reuse its synchronous visitor but every current quaternion is normalized normally; no quaternion, target or result cache survives a call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The helper retains no visitor, input or output. Only an extreme call allocates a temporary scaled quaternion, and the callback owns its independently returned result. No collection, global state, handle or task is acquired.
 */
export function readNormalizedQuaternion<Result, Context>(
  q: IAutoMovieQuaternion,
  read: (x: number, y: number, z: number, w: number,
    raw: IAutoMovieQuaternion, context: Context) => Result,
  context: Context,
): Result {
  const divisor: number = quaternionNormalizationDivisor(q.x, q.y, q.z, q.w);
  const value: IAutoMovieQuaternion = divisor === 1 ? q : {
    x: q.x / divisor, y: q.y / divisor, z: q.z / divisor, w: q.w / divisor,
  };
  const len: number = Math.sqrt(
    value.x * value.x + value.y * value.y + value.z * value.z + value.w * value.w,
  );
  if (len === 0) return read(0, 0, 0, 1, q, context);
  const inv: number = 1 / len;
  return read(value.x * inv, value.y * inv, value.z * inv, value.w * inv, q, context);
}
