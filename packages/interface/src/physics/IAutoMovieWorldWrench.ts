import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * World-axis force and moment about an origin supplied by the enclosing physical record.
 *
 * force uses N and torque N m about the supplied origin; both vectors use world axes. The support allocator consumes this shape as demand and returns allocated and residual wrenches. trackPhysicalWorld records the same values about the measured root COM. These virtual support quantities predict demand rather than observe contact impulse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines world axes, SI units, enclosing-origin ownership and the virtual allocation meaning.
 * @evidence contracts/development/design.md#principled-representation The two vectors carry force and moment; their origin remains explicit on the allocator input or enclosing diagnostic, and the producer admits finite components.
 * @evidence contracts/development/design.md#minimal-and-owned-surface distributePhysicalSupportWrench and trackPhysicalWorld exchange this same requested, allocated and residual quantity without duplicate force/torque records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A virtual wrench is a controller prediction, not an observed contact impulse; the origin belongs to the enclosing diagnostic.
 */
export interface IAutoMovieWorldWrench {
  /** World newtons. */
  force: IAutoMovieVector3;

  /** World newton metres about the enclosing record's explicit origin. */
  torque: IAutoMovieVector3;
}
