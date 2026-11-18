import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Read the original quaternion-vector rotation's completed X/Y/Z values.
 * A unit quaternion rotates v in its frame; nonunit inputs keep the direct
 * operation's distortion and nonfinite arithmetic, with no normalization or
 * new admission. All original q/v property reads and expressions complete in
 * order before the synchronous visitor receives its context. The visitor owns
 * its result, and errors propagate without retaining inputs or pending state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rotation frame/unit premise, unchanged nonunit/nonfinite behavior, original property-read order, synchronous completed XYZ/context transfer and caller-owned result/error lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original tx/ty/tz=2*(quaternion-vector cross) followed by v+w*t+qVectorCross(t), preserving each scalar expression and q/v read order. No normalization or association changes the binary64 rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One math owner serves Quaternion.rotateVector's static fresh-record constructor and inverse extraction's numeric column writer. The inverse retains all three rotations before its original dot reads; no copied rotation formula or caller-specific motion math is introduced.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every cross/output component still executes in its original order, including nonunit distortion, signed zeros and nonfinite propagation. No sparse/cardinal inference, unit repair, tolerance, omitted admission or target-result cache replaces the calculation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the same fixed two-cross-product arithmetic. Public vector rotation allocates its required fresh record; inverse extraction writes all three columns to one nine-cell numeric array instead of three vector records, removing two temporary containers per query. Static visitors avoid per-rotation closures; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing full rotation and inverse column consumers share one exact arithmetic owner and their static visitors. Each current quaternion/vector pair is actually read and rotated, with no vector, basis or target answer shared across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows q/v and visitor/context only during the call, creates no record or collection itself and retains no input/result/pending state. The visitor owns any output; inverse query arrays remain local and public vectors remain fresh.
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
  return read(x, y, z, context);
}
