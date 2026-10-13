import { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A TRS (translate, rotate, scale) transform placing something in its parent's
 * space.
 *
 * A local point is scaled, then rotated, then translated: `Matrix4.compose`
 * builds `T · R · S` with the same arithmetic as `three.js`, and glTF node
 * transforms use the same order, so the engine and viewer agree bit for bit.
 * Scene nodes, cameras, lights, bones, model parts, attachments, and a pose's
 * root all carry one. Joint articulation does not; it uses semantic angles
 * ({@link IAutoMovieJointPose}), because a TRS per joint would ask the model for
 * quaternions.
 *
 * `validateTransformScalars`, which the model, pose, affordance, and building
 * validators call, refuses a non-finite component, a rotation whose length is
 * more than `1e-6` from 1, and a scale component at or below zero; the
 * production scene artifact check applies the same rules to scene nodes,
 * cameras, and lights.
 *
 * @evidence contracts/common.md#principled-implementation The affine composition `T · R · S` with a unit quaternion and per-axis positive scale, matching glTF node semantics; positive scale keeps the matrix invertible and orientation-preserving, which `Matrix4.decompose` relies on to recover the three parts.
 * @evidence contracts/common.md#clear-and-simple-design Three named parts instead of a 4x4 matrix keep each part checkable on its own and decomposable without numerical fitting, and one shape serves every placed record so a single validator covers them all.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shear, mirror or zero scale is representable through validation, so no consumer needs a fallback for a singular or reflected frame; the type carries no parent id, leaving the hierarchy to the record that owns it.
 * @evidence contracts/common.md#meaningful-documentation States the application order and the matrix it builds, which records carry a transform and why joints do not, and which validators refuse which values; members give units, the rotation's representation, and the identity scale.
 * @author Samchon
 */
export interface IAutoMovieTransform {
  /** Translation in parent space, meters. */
  translation: IAutoMovieVector3;

  /**
   * Rotation as a unit quaternion. For character joints the engine derives it
   * from semantic angles rather than asking the model for it.
   */
  rotation: IAutoMovieQuaternion;

  /**
   * Per-axis scale factor, dimensionless with `1` as identity; uniform scale is
   * `{ x: s, y: s, z: s }`. Every component must be greater than zero.
   */
  scale: IAutoMovieVector3;
}
