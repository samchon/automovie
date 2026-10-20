/**
 * A rotation expressed as intrinsic Euler angles in degrees.
 *
 * Quaternion.fromEuler multiplies one axis-angle quaternion per order letter from left to right, so XYZ gives qx · qy · qz, the intrinsic convention three.js uses. Angles are not range-checked or wrapped; finite values compose with floating-point rounding.
 *
 * No authored record field carries this type. Instance-set paths use it for seeded per-slot offsets in instanceSlot and fixed rotation-range offsets in builtInstanceSetPlacementBounds, both in XYZ order. Character articulation uses semantic joint angles through {@link IAutoMovieJointPose}; Euler angles depend on order and have gimbal singularities.
 *
 * @evidence contracts/common.md#principled-implementation Intrinsic Euler composition multiplies single-axis quaternions in the declared order through Quaternion.fromEuler. Unit factors give a unit rotation mathematically, with binary64 rounding in implementation; the order field distinguishes the six conventions.
 * @evidence contracts/common.md#clear-and-simple-design Three angles plus an order enum cover every intrinsic Tait-Bryan convention without a matrix or quaternion field, and the type stays the single parameter shape of `fromEuler` rather than a structural copy at the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller special-cases an order; both instance-set callers state `"XYZ"` explicitly, and the composition never normalizes angles or wraps them into a range it would then have to document.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the composition rule with the `"XYZ"` example, that angles are not range-checked, the actual callers, and why character joints use semantic angles instead; members give the axis and unit.
 */
export interface IAutoMovieEuler {
  /** Rotation about the local X axis, degrees. */
  x: number;

  /** Rotation about the local Y axis, degrees. */
  y: number;

  /** Rotation about the local Z axis, degrees. */
  z: number;

  /**
   * Intrinsic rotation order: the letters name the axes applied first to last about the body's successive local axes.
   */
  order: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
}
