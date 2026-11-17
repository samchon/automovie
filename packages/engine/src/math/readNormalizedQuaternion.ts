import type { IAutoMovieQuaternion } from "@automovie/interface";

import { quaternionNormalizationDivisor } from "./quaternionNormalizationDivisor";

/** Wide binary64 norm bounds proving the original component gate returns one. */
const ORDINARY_SQUARED_MIN: number = 2 ** -1000;
const ORDINARY_SQUARED_MAX: number = 2 ** 1000;

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
 * @evidence contracts/development/implementation.md#principled-implementation Both adapters retain original positive rescaling, divisions, leftfold four-square norm, sqrt, reciprocal and component products. For completed scalars, a norm square in [2^-1000,2^1000] proves divisor1: largest<2^-511 gives each rounded square<=2^-1022 and sum<=2^-1020; largest>2^510 gives one rounded square>=2^1020 and nonnegative sum at least that. Zero/nonfinite sums fail this interval. Thus only a proved ordinary input skips the magnitude gate, reusing the identical norm arithmetic; all other inputs keep the original divisor and scaled expression. Record reads retain their original order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal normalization module serves Quaternion.normalize's record constructor, scalar inverse/angle/slerp work and projector scores. The record entry keeps its original raw-input gate/order. fromScalars computes its exact ordinary norm once, uses a conservative binary64 certificate only for divisor1, and otherwise delegates unchanged rescaling to quaternionNormalizationDivisor. Actual consumers reuse visitors without per-call capture or pending-input state.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unit-input shortcut, dot tolerance, alternate norm, direction repair, t clamp or multiplication reassociation is introduced. Zero identity, binary64 thresholds, signed zeros and nonfinite propagation preserve the original expressions; each visitor runs exactly once synchronously and no target-dependent answer is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work stays fixed-sized. Completed-scalar norms in the certified ordinary interval omit four absolute values, maximum and component-gate checks; extreme scaled inputs additionally compute four unused raw squares before the unchanged scaled norm. Record input work/order stays unchanged. Scalar consumers omit normalized/source/scaled records as applicable and reuse static visitors; public normalize keeps fresh output and its original extreme temporary. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The completed-scalar four-square norm both proves ordinary-range admission and supplies the identical sqrt input; other magnitudes use the same original divisor owner and scaled expression. Record consumers preserve their raw reads. Every current input is normalized independently with its exact arithmetic; no input, target, context or result cache survives a call.
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
 * @evidence contracts/development/design.md#principled-representation Inversion, angle, interpolation and projector scoring already complete four scalar components before normalization. Their exact leftfold square sum can also prove the original component range safe with wide binary64 bounds; no unit-length assumption or changed normalization represents those inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One internal scalar entry serves actual inverse, angle, slerp and projector score consumers. The record entry remains available where source component-read order or the original raw quaternion matters; no new root export, mutable output, result cache or alternate normalization policy is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a four-square sum proved inside the original unscaled component range skips its magnitude check. Outside that conservative binary64 interval, original divisor/scaling applies; zero/nonfinite and sqrt/reciprocal/component expressions stay unchanged. The visitor receives completed values/context with no unit shortcut, endpoint substitution, physical tolerance or cached answer.
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
    let a: number = x;
    let b: number = y;
    let c: number = z;
    let d: number = w;
    let squared: number = x * x + y * y + z * z + w * w;
    if (!(squared >= ORDINARY_SQUARED_MIN && squared <= ORDINARY_SQUARED_MAX)) {
      const divisor: number = quaternionNormalizationDivisor(x, y, z, w);
      if (divisor !== 1) {
        a = x / divisor;
        b = y / divisor;
        c = z / divisor;
        d = w / divisor;
        squared = a * a + b * b + c * c + d * d;
      }
    }
    const len: number = Math.sqrt(squared);
    if (len === 0) return read(0, 0, 0, 1, context);
    const inv: number = 1 / len;
    return read(a * inv, b * inv, c * inv, d * inv, context);
  }
}
