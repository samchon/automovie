/** One fixed Hermite interval's exact stored endpoint data. */
export interface IAutoMovieMotionTrajectoryInterval {
  /** First knot time, seconds. */
  from: number;
  /** Next knot time, seconds. */
  to: number;
  /** State at the first knot. */
  start: readonly number[];
  /** State at the next knot. */
  end: readonly number[];
  /** State derivative at the first knot. */
  first: readonly number[];
  /** State derivative at the next knot. */
  last: readonly number[];
}
