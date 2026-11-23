import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Read the original quaternion-vector rotation's completed X/Y/Z values.
 * A unit quaternion rotates v in its frame; nonunit inputs keep the direct
 * operation's distortion and nonfinite arithmetic, with no normalization or
 * new admission. All original q/v property reads and expressions complete in
 * order before the synchronous visitor receives its context. The visitor owns
 * its result, and errors propagate without retaining inputs or pending state.
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
