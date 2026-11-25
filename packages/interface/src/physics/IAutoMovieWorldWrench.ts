import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * World-axis force and moment about an origin supplied by the enclosing
 * physical record.
 *
 * Force uses N and torque N m about the supplied origin; both vectors use world
 * axes. The support allocator consumes this shape as demand and returns
 * allocated and residual wrenches. trackPhysicalWorld records the same values
 * about the measured root COM. These virtual support quantities predict demand
 * rather than observe contact impulse.
 */
export interface IAutoMovieWorldWrench {
  /** World newtons. */
  force: IAutoMovieVector3;

  /** World newton metres about the enclosing record's explicit origin. */
  torque: IAutoMovieVector3;
}
