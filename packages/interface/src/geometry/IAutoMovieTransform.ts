import { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A TRS (translate / rotate / scale) transform placing a node in its parent's
 * space.
 *
 * Mirrors glTF node transform semantics so it maps 1:1 onto `three.js` and
 * glTF host adapters: a local point is scaled, then rotated, then translated.
 * Used for scene-node placement ({@link IAutoMovieSceneNode}) and the root
 * transform of a pose ({@link IAutoMoviePose}). Per-joint articulation does NOT
 * use this: joints use semantic angles ({@link IAutoMovieJointPose}); a full TRS
 * per joint would hand the LLM quaternions it cannot emit reliably.
 *
 * @evidence contracts/common.md#principled-implementation glTF TRS semantics, `T · R · S` applied to a local point, so the record converts one-to-one into a glTF node or a three.js object transform without a conversion step.
 * @evidence contracts/common.md#clear-and-simple-design Three fields matching glTF's translation, rotation and scale node fields, reusing the shared vector and quaternion types instead of a matrix or a transform-specific shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node is special-cased; `validateTransformScalars` refuses non-finite components, a rotation length more than `1e-6` from 1, and any scale component at or below zero instead of clamping them.
 * @evidence contracts/common.md#meaningful-documentation States the parent frame, the composition order, the metre translation, the unit-quaternion rotation, the dimensionless scale with identity `1`, the refused values, and why joints do not use this type.
 * @author Samchon
 */
export interface IAutoMovieTransform {
  /** Translation in parent space (meters). */
  translation: IAutoMovieVector3;

  /**
   * Rotation as a unit quaternion. Engine-facing; for character joints the
   * engine derives this from semantic angles rather than asking the LLM for
   * it.
   */
  rotation: IAutoMovieQuaternion;

  /**
   * Per-axis scale factor (dimensionless, `1` = identity). Uniform scale is `{
   * x: s, y: s, z: s }`. Non-positive components are rejected by the engine.
   */
  scale: IAutoMovieVector3;
}
