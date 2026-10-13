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
