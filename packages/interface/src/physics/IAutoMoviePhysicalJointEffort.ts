/**
 * Effective tracking fraction of one joint motor at one native tick.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains override, recovery fraction and disturbance softening on the native clock.
 * @evidence contracts/development/design.md#principled-representation Dimensionless tracking fractions multiply independently; softenedUntil and seconds use the same local-second clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalJointEffort combines target, recovery and disturbance policies for the existing joint motors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent override preserves body effort and an absent softening deadline means no disturbance; no muscle strength is inferred from identity.
 */
export namespace IAutoMoviePhysicalJointEffort {
  /**
   * Effective tracking fraction of one joint motor at one native tick.
   *
   * An explicit per-joint override replaces the body's effort; a joint inside a
   * moving recovery limb takes the balance policy's joint fraction; a joint whose
   * child received a disturbance stays compliant, multiplied by the declared
   * compliance fraction, until its softening deadline has passed. The factors
   * are independent, so they multiply.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains override, recovery fraction and disturbance softening on the native clock.
   * @evidence contracts/development/design.md#principled-representation Dimensionless tracking fractions multiply independently; softenedUntil and seconds use the same local-second clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalJointEffort combines target, recovery and disturbance policies for the existing joint motors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent override preserves body effort and an absent softening deadline means no disturbance; no muscle strength is inferred from identity.
   */
  export type IInput = {
    /** Body tracking fraction for this interval, in [0, 1]. */ effort: number;
    /** Explicit per-joint fraction, when the target declares one. */ override?: number;
    /** Balance joint fraction, present only while this joint's limb is a moving recovery limb. */ recovery?: number;
    /** Seconds until which the joint's child stays softened; absent when it never was. */ softenedUntil?: number;
    /** Current native tick time, seconds. */ seconds: number;
    /** Tracking fraction while compliant, in [0, 1]. */ compliance: number;
  };
}
