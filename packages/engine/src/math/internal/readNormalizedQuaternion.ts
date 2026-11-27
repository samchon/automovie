import type { IAutoMovieQuaternion } from "@automovie/interface";

import { quaternionNormalizationDivisor } from "./quaternionNormalizationDivisor";

/*
 * Wide binary64 norm bounds proving the original component gate returns one.
 */
const ORDINARY_SQUARED_MIN: number = 2 ** -1000;
const ORDINARY_SQUARED_MAX: number = 2 ** 1000;

/*
 * Read normalized quaternion components synchronously without a unit record.
 * The visitor receives the original normalization's X/Y/Z/W values, the raw
 * quaternion and caller context. Context transfers existing inputs without
 * constructing a per-call closure or wrapper. Zero length reads identity and
 * nonfinite propagation stays unchanged. An extreme input still creates the
 * original scaled record. The visitor owns its returned result. Visitor errors
 * propagate after normalization; nothing is retained. fromScalars accepts four
 * already completed components and visits normalized X/Y/Z/W followed by caller
 * context only, without manufacturing an input or extreme scaled record.
 * Inverse, angle and slerp reuse their static visitors.
 */
export function readNormalizedQuaternion<Result, Context>(
  q: IAutoMovieQuaternion,
  read: (
    x: number,
    y: number,
    z: number,
    w: number,
    raw: IAutoMovieQuaternion,
    context: Context,
  ) => Result,
  context: Context,
): Result {
  const divisor: number = quaternionNormalizationDivisor(q.x, q.y, q.z, q.w);
  const value: IAutoMovieQuaternion =
    divisor === 1
      ? q
      : {
          x: q.x / divisor,
          y: q.y / divisor,
          z: q.z / divisor,
          w: q.w / divisor,
        };
  const len: number = Math.sqrt(
    value.x * value.x +
      value.y * value.y +
      value.z * value.z +
      value.w * value.w,
  );
  if (len === 0) return read(0, 0, 0, 1, q, context);
  const inv: number = 1 / len;
  return read(
    value.x * inv,
    value.y * inv,
    value.z * inv,
    value.w * inv,
    q,
    context,
  );
}

/*
 * Normalization of four already completed scalar components.
 */
export namespace readNormalizedQuaternion {
  /*
   * Read the same normalized X/Y/Z/W from completed scalar inputs. Zero length
   * visits identity; nonfinite propagation stays arithmetic. Every callback
   * runs once synchronously and owns its result. No source record is created.
   */
  export function fromScalars<Result, Context>(
    x: number,
    y: number,
    z: number,
    w: number,
    read: (
      x: number,
      y: number,
      z: number,
      w: number,
      context: Context,
    ) => Result,
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
