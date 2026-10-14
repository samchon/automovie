/**
 * A unit quaternion `(x, y, z, w)` describing a 3D rotation.
 *
 * Joint articulation is authored as semantic degrees through {@link IAutoMovieJointPose}; jointToQuaternion converts those angles to bone-local rotations, motionToClip emits general node tracks, and decomposeJointRotation reads rotations back into semantic angles during imported-motion conversion. Placement records, including {@link IAutoMovieExplicitInstanceTransform}, may carry a quaternion directly.
 *
 * Component order is glTF's `(x, y, z, w)`, and Quaternion.multiply(a, b) applies b first without normalization. validateTransformScalars refuses nonfinite components and a norm more than 1e-6 from one, retaining admitted components unchanged. Direct rotateVector and matrix composition likewise do not normalize; callers needing a unit copy use Quaternion.normalize, whose zero-input convention returns identity. q and -q represent the same rotation, and no record requires either sign.
 *
 * @evidence contracts/common.md#principled-implementation A unit quaternion represents rotation and composes by the Hamilton product in glTF component order. validateTransformScalars checks finite components and norm within 1e-6 for consumers that apply that gate; direct numerical helper calls still carry their own admitted-input premises.
 * @evidence contracts/common.md#clear-and-simple-design Four plain numbers in the order glTF and `three.js` store, so the engine, viewer and imported clips exchange rotations without reordering or a wrapper class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transform validation refuses out-of-domain rotations without repairing them and does not promise automatic normalization for admitted values. Quaternion.normalize's zero-input identity is its explicit degeneracy convention, while direct multiplication, vector rotation and matrix composition retain their stated unit-input premises.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes semantic joint authoring from direct quaternion placement, identifies conversion readers, gives component and multiplication order, validation tolerance, explicit normalization behavior and sign ambiguity; members identify each component.
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
