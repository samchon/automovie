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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States scalar order, zero identity, nonfinite arithmetic, one synchronous visitor, caller context and absence of a temporary source quaternion.
   * @evidence contracts/development/implementation.md#principled-implementation The scalar adapter applies the record entry's exact magnitude gate, per-component divisions, left-associated square sum, square root, reciprocal and four products to the same already computed numbers. It introduces no reassociation of a caller's component expressions or normalization arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both record and scalar adapters live with their one normalization owner and share quaternionNormalizationDivisor. This adapter owns only primitive rescaling/norm work, while inverse, angle and slerp supply their actual component expressions and result visitor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero identity, binary64 range thresholds, signed zeros and nonfinite propagation remain the original ones. No direction repair, normalization skip, t clamp or target-dependent answer is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size scalar magnitude/norm work omits both the intermediate input quaternion and any extreme scaled-quaternion record. Actual inverse/angle/slerp callers reuse static visitors rather than allocating one callback per read. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing record and completed-scalar consumers use one internal normalization module and one magnitude policy. Every incoming four-number reading is normalized normally, with no retained input, context or result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The adapter allocates no quaternion or collection, retains no visitor/context/input and returns only the callback's owned result. There is no global state, handle or task.
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
