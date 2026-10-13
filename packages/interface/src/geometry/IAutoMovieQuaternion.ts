/**
 * A unit quaternion `(x, y, z, w)` describing a 3D rotation.
 *
 * This is **engine / interchange representation, not LLM-facing**. automovie
 * exposes joint rotation to the model as semantic degrees precisely because
 * quaternions are opaque to language models and easy to emit wrong (the
 * unit-norm constraint is not something a model tracks). The engine produces
 * quaternions when converting a validated {@link IAutoMovieJointPose} into
 * bone-local rotations for `three.js` / glTF / VRMA export, and consumes them
 * when ingesting an imported rig back into semantic angles.
 *
 * Order is glTF's `(x, y, z, w)`. Transform validators such as
 * `validateTransformScalars` refuse a length more than `1e-6` away from 1;
 * inside that tolerance the engine's `Quaternion` helpers renormalize rather
 * than reject, and `Quaternion.normalize` maps a zero quaternion to identity.
 *
 * @evidence contracts/common.md#principled-implementation Unit quaternions compose by the Hamilton product without gimbal lock and map directly onto glTF and three.js rotations, which is why the engine rotates with them while semantic angles stay the authoring surface.
 * @evidence contracts/common.md#clear-and-simple-design Four scalar fields in glTF order with no methods, so the same object serializes into JSON, glTF and three.js unchanged; the arithmetic lives in the engine's `Quaternion` namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input is special-cased; the `1e-6` length tolerance is a stated validation bound, and renormalization inside the math helpers absorbs only accumulated rounding, with identity as the stated result for a zero quaternion.
 * @evidence contracts/common.md#meaningful-documentation States the component order and meaning, the unit-norm expectation and its tolerance, the renormalization and zero-length behaviour, and why language models are not asked to emit it.
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
