/**
 * A unit quaternion `(x, y, z, w)` describing a 3D rotation.
 *
 * This is the engine and interchange representation, not an authoring one.
 * automovie exposes joint rotation to the model as semantic degrees because a
 * model does not keep four numbers on the unit sphere. The engine's
 * `jointToQuaternion` produces quaternions from a validated
 * {@link IAutoMovieJointPose} for bone-local rotations and `motionToClip`'s
 * `three.js` tracks, and `decomposeJointRotation` reads them back into
 * semantic angles when `importedNodeClipToAutoMovieMotion` ingests an imported
 * clip.
 *
 * Component order is glTF's `(x, y, z, w)`, and `Quaternion.multiply(a, b)`
 * applies `b` first. `validateTransformScalars` refuses a non-finite component
 * and a length more than `1e-6` away from 1; inside that tolerance the
 * engine's `Quaternion` helpers renormalize rather than reject, and
 * `Quaternion.normalize` maps a zero quaternion to identity. `q` and `-q` are
 * the same rotation, and no record requires either sign.
 *
 * @evidence contracts/common.md#principled-implementation A unit quaternion represents a rotation without gimbal lock and composes by the Hamilton product, which `Quaternion.multiply` implements in glTF component order; the unit-length premise is enforced to `1e-6` by `validateTransformScalars` before any record is posed.
 * @evidence contracts/common.md#clear-and-simple-design Four plain numbers in the order glTF and `three.js` store, so the engine, viewer and imported clips exchange rotations without reordering or a wrapper class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A near-unit value inside the tolerance is renormalized by the math helpers and a value outside it is refused by validation, rather than silently rescaled at the boundary; the zero-quaternion fallback to identity is the documented degenerate case of `normalize`.
 * @evidence contracts/common.md#meaningful-documentation States why authors never write one, which functions produce and consume it, component order and multiplication order, the length tolerance, the renormalization and zero cases, and the sign ambiguity; members name each component.
 * @author Samchon
 */
export interface IAutoMovieQuaternion {
  /** Imaginary i component. */
  x: number;

  /** Imaginary j component. */
  y: number;

  /** Imaginary k component. */
  z: number;

  /** Real (scalar) component. */
  w: number;
}
