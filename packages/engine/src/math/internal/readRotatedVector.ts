import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Read the original quaternion-vector rotation's completed X/Y/Z values. A unit
 * quaternion rotates v in its frame without normalization. When the direct
 * computation overflows, split the vector into an exactly rescalable part and
 * its subnormal remainder. The synchronous visitor owns its result.
 */
export function readRotatedVector<Result, Context>(
  q: IAutoMovieQuaternion,
  v: IAutoMovieVector3,
  read: (x: number, y: number, z: number, context: Context) => Result,
  context: Context,
): Result {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  const x: number = v.x + q.w * tx + (q.y * tz - q.z * ty);
  const y: number = v.y + q.w * ty + (q.z * tx - q.x * tz);
  const z: number = v.z + q.w * tz + (q.x * ty - q.y * tx);
  const finiteX: boolean = Math.abs(x) < Infinity;
  const finiteY: boolean = Math.abs(y) < Infinity;
  const finiteZ: boolean = Math.abs(z) < Infinity;
  if (!(finiteX && finiteY && finiteZ)) {
    const recovered: IAutoMovieVector3 | null = recoverRotation(q, v);
    if (recovered !== null)
      return read(
        finiteX ? x : recovered.x,
        finiteY ? y : recovered.y,
        finiteZ ? z : recovered.z,
        context,
      );
  }
  return read(x, y, z, context);
}

/**
 * For quaternion components bounded by one, the first cross terms are at
 * most 4 times the largest vector component. The final sum is bounded by
 * 1 + 4 + 8 times that component. Sixteen is the first power of two above it.
 */
const RESCALE: number = 16;

/**
 * Reapply the homogeneous vector formula with enough range for its maximum
 * intermediate. Keep the subnormal remainder displaced by downscaling so an
 * axis unaffected by a large component retains its own small value.
 */
function recoverRotation(
  q: IAutoMovieQuaternion,
  v: IAutoMovieVector3,
): IAutoMovieVector3 | null {
  if (
    !(
      Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z), Math.abs(q.w)) <= 1
    )
  )
    return null;

  const scaled: IAutoMovieVector3 = {
    x: v.x / RESCALE,
    y: v.y / RESCALE,
    z: v.z / RESCALE,
  };
  const lost: IAutoMovieVector3 = {
    x: v.x - scaled.x * RESCALE,
    y: v.y - scaled.y * RESCALE,
    z: v.z - scaled.z * RESCALE,
  };
  const remainder: number = Math.max(
    Math.abs(lost.x),
    Math.abs(lost.y),
    Math.abs(lost.z),
  );

  // Division by a power of two rounds only in the subnormal range. A
  // nonfinite arithmetic remainder cannot be recovered by scaling.
  if (!(remainder <= (RESCALE / 2) * Number.MIN_VALUE)) return null;

  const wide: IAutoMovieVector3 = readRotatedVector(
    q,
    scaled,
    rotationRecord,
    undefined,
  );
  if (remainder === 0)
    return {
      x: wide.x * RESCALE,
      y: wide.y * RESCALE,
      z: wide.z * RESCALE,
    };

  const narrow: IAutoMovieVector3 = readRotatedVector(
    q,
    lost,
    rotationRecord,
    undefined,
  );
  return {
    x: wide.x * RESCALE + narrow.x,
    y: wide.y * RESCALE + narrow.y,
    z: wide.z * RESCALE + narrow.z,
  };
}

/** Keep a completed partial rotation for the extreme-range recovery. */
function rotationRecord(x: number, y: number, z: number): IAutoMovieVector3 {
  return { x, y, z };
}
