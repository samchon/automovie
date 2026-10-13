/**
 * A rotation expressed as intrinsic Euler angles in degrees.
 *
 * `Quaternion.fromEuler` turns it into a quaternion by multiplying one
 * axis-angle quaternion per letter of `order`, left to right, so `"XYZ"` is
 * `qx·qy·qz`: the intrinsic convention `three.js` uses, applying X first about
 * the local axes. Angles are not range-checked; any finite value composes.
 *
 * No authored record field carries this type. Its callers are the instance-set
 * paths, which compose a seeded rotation offset in `"XYZ"` order per slot
 * (`instanceSlot`) and the fixed offset of a set whose rotation range is a
 * single value (`builtInstanceSetPlacementBounds`). Characters use semantic
 * joint angles ({@link IAutoMovieJointPose}) instead, because Euler angles are
 * order-sensitive and lose a degree of freedom at gimbal lock.
 *
 * @evidence contracts/common.md#principled-implementation Intrinsic Euler composition is the product of single-axis quaternions in the stated order, which `Quaternion.fromEuler` computes through `fromAxisAngle` and `multiply`; a unit result follows because each factor is unit, and the order field removes the ambiguity of which of the six conventions applies.
 * @evidence contracts/common.md#clear-and-simple-design Three angles plus an order enum cover every intrinsic Tait-Bryan convention without a matrix or quaternion field, and the type stays the single parameter shape of `fromEuler` rather than a structural copy at the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller special-cases an order; both instance-set callers state `"XYZ"` explicitly, and the composition never normalizes angles or wraps them into a range it would then have to document.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the composition rule with the `"XYZ"` example, that angles are not range-checked, the actual callers, and why character joints use semantic angles instead; members give the axis and unit.
 * @author Samchon
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
   * about the body's local axes.
   */
  order: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
}
