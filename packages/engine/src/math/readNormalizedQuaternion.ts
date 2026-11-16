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
 * fromScalars accepts four already completed components and visits normalized
 * X/Y/Z/W followed by caller context only, without manufacturing an input or
 * extreme scaled record. Inverse, angle and slerp reuse their static visitors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the record entry's normalized X/Y/Z/W then raw/context arguments and the scalar entry's normalized X/Y/Z/W then context, synchronous one-visitor execution, zero identity, distinct extreme temporary ownership, nonfinite behavior, result ownership and error propagation.
 * @evidence contracts/development/implementation.md#principled-implementation Both adapters apply Quaternion.normalize's original positive rescaling, per-component divisions, left-associated four-square norm, square root, reciprocal and component products. Record input reads retain their original order; the scalar adapter uses the same already computed numbers without reassociating the caller's component expressions. Visitors receive those exact completed X/Y/Z/W scalars without changing a normalization boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal normalization module serves Quaternion.normalize's record constructor, scalar inverse/angle/slerp work and projector scores. Both adapters share quaternionNormalizationDivisor; the record entry lends its raw quaternion/context, while fromScalars owns only primitive rescaling/norm work. These actual consumers reuse visitors without per-call capture or mutable pending-input bindings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unit-input shortcut, dot tolerance, alternate norm, direction repair, t clamp or multiplication reassociation is introduced. Zero identity, binary64 thresholds, signed zeros and nonfinite propagation preserve the original expressions; each visitor runs exactly once synchronously and no target-dependent answer is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size magnitude/norm work is unchanged. Record-based scalar consumers omit a normalized quaternion allocation while public normalize still creates its required fresh record and preserves its extreme scaled temporary. fromScalars additionally omits the source and extreme scaled records; actual inverse/angle/slerp callers reuse static visitors. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Record and completed-scalar consumers share this one normalization module and magnitude policy. A caller may reuse its synchronous visitor, but every current quaternion or four-number input is normalized normally; no input, target, context or result cache survives a call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Neither adapter retains a visitor, context, input or result. Only an extreme record-input call allocates a temporary scaled quaternion; fromScalars allocates no quaternion or collection. Every callback owns its independently returned result, with no global state, handle or task acquired.
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

/**
 * Normalization of four already completed scalar components.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the scalar entry's same normalization policy, synchronous visitor and caller-context ownership without manufacturing a source quaternion.
 * @evidence contracts/development/design.md#principled-representation Inversion, relative-angle reading and interpolation already compute four scalar components before normalizing them. Passing those exact completed numbers preserves their calculation order while omitting an intermediate representation that no caller consumes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal scalar entry serves the actual inverse, angle and slerp owners. The record entry remains available where source component-read order or the original raw quaternion matters; no new root export, mutable output, result cache or alternate normalization policy is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The same shared magnitude gate and original square-root/reciprocal/component products apply to all magnitudes. The visitor receives only completed normalized numbers and its caller context; no unit shortcut, endpoint substitution or tolerance is represented.
 */
export namespace readNormalizedQuaternion {
  /**
   * Read the same normalized X/Y/Z/W from completed scalar inputs. Zero length
   * visits identity; nonfinite propagation stays arithmetic. Every callback
   * runs once synchronously and owns its result. No source record is created.
   */
  export function fromScalars<Result, Context>(
    x: number, y: number, z: number, w: number,
    read: (x: number, y: number, z: number, w: number, context: Context) => Result,
    context: Context,
  ): Result {
    const divisor: number = quaternionNormalizationDivisor(x, y, z, w);
    const a: number = divisor === 1 ? x : x / divisor;
    const b: number = divisor === 1 ? y : y / divisor;
    const c: number = divisor === 1 ? z : z / divisor;
    const d: number = divisor === 1 ? w : w / divisor;
    const len: number = Math.sqrt(a * a + b * b + c * c + d * d);
    if (len === 0) return read(0, 0, 0, 1, context);
    const inv: number = 1 / len;
    return read(a * inv, b * inv, c * inv, d * inv, context);
  }
}
