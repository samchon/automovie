/**
 * Whether a body's default tracking is withdrawn at one tick.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes zero effective body strength from explicit protective joint effort.
 * @evidence contracts/development/design.md#principled-representation strength and optional per-joint values are admitted dimensionless fractions; any positive override keeps tracking active.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalTrackingWithdrawn reads the same effective policy used by physical motors and released-quality selection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero body fraction alone does not classify a body as released when an explicit joint still owns protective tracking.
 */
export namespace IAutoMoviePhysicalTrackingWithdrawn {
  /**
   * Whether a body's default tracking is withdrawn at one tick.
   *
   * Tracking is withdrawn only when the effective body strength is zero and no
   * explicit per-joint protective strength stays positive; an explicit joint
   * keeps its own motor and therefore keeps the body under tracking.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes zero effective body strength from explicit protective joint effort.
   * @evidence contracts/development/design.md#principled-representation strength and optional per-joint values are admitted dimensionless fractions; any positive override keeps tracking active.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalTrackingWithdrawn reads the same effective policy used by physical motors and released-quality selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero body fraction alone does not classify a body as released when an explicit joint still owns protective tracking.
   */
  export type ITarget = {
    /** Effective body tracking fraction: authored strength times balance root strength. */ strength: number;
    /** Explicit per-joint fractions declared by the target. */ jointStrength?: Readonly<
      Record<string, number>
    >;
  };
}
