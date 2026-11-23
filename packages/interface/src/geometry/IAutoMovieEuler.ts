/**
 * A rotation expressed as intrinsic Euler angles in degrees.
 *
 * Quaternion.fromEuler multiplies one axis-angle quaternion per order letter
 * from left to right, so XYZ gives qx · qy · qz, the intrinsic convention
 * three.js uses. Angles are not range-checked or wrapped; finite values compose
 * with floating-point rounding.
 *
 * No authored record field carries this type. Instance-set paths use it for
 * seeded per-slot offsets in instanceSlot and fixed rotation-range offsets in
 * builtInstanceSetPlacementBounds, both in XYZ order. Character articulation
 * uses semantic joint angles through {@link IAutoMovieJointPose}; Euler angles
 * depend on order and have gimbal singularities.
 */
export interface IAutoMovieEuler {
  /** Rotation about the local X axis, degrees. */
  x: number;

  /** Rotation about the local Y axis, degrees. */
  y: number;

  /** Rotation about the local Z axis, degrees. */
  z: number;

  /**
   * Intrinsic rotation order: the letters name the axes applied first to last
   * about the body's successive local axes.
   */
  order: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
}
