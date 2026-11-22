/**
 * One limited angular coordinate in a joint's parent frame.
 *
 * The parent-frame axis is unique within the joint. Physical limits are ordered radians within [-pi, pi]. Motor stiffness and damping are nonnegative, maximum torque positive. Runtime readers use zero passiveDamping and +1 coordinateSign when absent. A supplied sourceDomain describes the provider's pre-sign authoring interval; physical limits must lie inside it after applying the sign. validatePhysicalProfile checks these relationships.
 *
 * @evidence contracts/development/design.md#principled-representation Physical angular limits and torque-control coefficients retain their SI units while channel and coordinateSign link them to a provider's authored coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Motor tracking, passive damping and range auditing share one axis record; optional sourceDomain records only an available provider interval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A named channel does not invent a range or axis, and omitted sourceDomain makes no claim that the physical limits cover an external clinical range.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frame, radian limits, PD units, optional defaults and source-to-physical sign correspondence.
 */
export interface IAutoMoviePhysicalJointAxis {
  /** Unique angular coordinate in the joint frame. */
  axis: "x" | "y" | "z";

  /** Inclusive lower radians, at least -pi. */
  minimum: number;

  /** Inclusive upper radians, at most pi. */
  maximum: number;

  /** PD stiffness in N m/rad. */
  stiffness: number;

  /** PD damping in N m s/rad. */
  damping: number;

  /** Passive joint friction, N m s/rad, retained at zero tracking strength; defaults to zero. */
  passiveDamping?: number;

  /** Positive maximum motor torque, N m; toward the axis maximum when `reverseTorque` is given, both ways otherwise. */
  maximumTorque: number;

  /** Positive maximum motor torque toward the axis minimum, N m, where it differs from `maximumTorque`, as a joint's extensors and flexors differ. */
  reverseTorque?: number;

  /** Provider's authoring coordinate, for honest ROM correspondence. */
  channel: string;

  /** Clinical/source coordinate sign relative to this physical axis; defaults to +1. */
  coordinateSign?: 1 | -1;

  /** Source authoring domain in radians before coordinateSign; physical limits must lie inside it. */
  sourceDomain?: {
    /** Lower source radians. */ minimum: number;

    /** Upper source radians. */ maximum: number;
  };
}
