/**
 * A rotation expressed as intrinsic Euler angles in degrees.
 *
 * A middle ground between LLM-friendly single-axis semantic angles
 * ({@link IAutoMovieJointPose}) and the engine's quaternions
 * ({@link IAutoMovieQuaternion}). It is occasionally useful for free 3D objects
 * (a prop tilted on three axes) where there is no anatomical joint to attach
 * semantic flexion/abduction names to.
 *
 * `order` records the intrinsic rotation order so the engine can compose the
 * axes unambiguously. Euler angles are gimbal-prone and order-sensitive. This
 * type is intentionally secondary; prefer semantic joint angles for
 * characters.
 *
 * No record field is declared with this type today. `Quaternion.fromEuler`
 * accepts the same shape structurally and composes `qx·qy·qz` for `"XYZ"`; its
 * two callers pass seeded population rotation offsets in `"XYZ"` order.
 *
 * @evidence contracts/common.md#principled-implementation Intrinsic Euler angles in degrees, composed by `Quaternion.fromEuler` as the product of per-axis quaternions in `order`, the three.js and glTF convention; gimbal lock when the middle axis reaches ±90° is a property of the representation and is not detected.
 * @evidence contracts/common.md#clear-and-simple-design Three angles plus an order literal, the minimum that makes an Euler triple unambiguous; the type is exported, but no schema field or engine parameter is declared with it, so it currently serves no reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No order is special-cased; `fromEuler` maps each letter of `order` to its axis generically, and nothing in the engine converts a quaternion back into this form.
 * @evidence contracts/common.md#meaningful-documentation States the degree unit, the intrinsic convention, the axis of each field, the order semantics, the gimbal and order sensitivity, and that no record field uses the type today.
 * @author Samchon
 */
export interface IAutoMovieEuler {
  /** Rotation about the local X axis, degrees. */
  x: number;

  /** Rotation about the local Y axis, degrees. */
  y: number;

  /** Rotation about the local Z axis, degrees. */
  z: number;

  /** Intrinsic rotation order in which `x`/`y`/`z` are applied. */
  order: "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
}
