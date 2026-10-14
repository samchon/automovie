import { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A translation, rotation and scale transform placing something in its parent's space.
 *
 * A local point is scaled, then rotated, then translated. Matrix4.compose builds T · R · S in the glTF/three.js convention; nodes, cameras, lights, bones, model parts, attachments and a pose's root carry this record. Joint articulation instead uses semantic angles through {@link IAutoMovieJointPose}.
 *
 * validateTransformScalars, used by model, pose, affordance, building and scene-artifact admission, refuses nonfinite components, a quaternion norm more than 1e-6 from one and nonpositive scale components without repairing the record. These scalar checks do not guarantee finite derived products, a representable inverse or an exactly decomposable hierarchy: rotating a child under nonuniform parent scale can introduce shear.
 *
 * @evidence contracts/common.md#principled-implementation T · R · S with a unit quaternion and positive axis scales is mathematically invertible and orientation-preserving. Runtime validation admits near-unit rotations within 1e-6 rather than proving exact orthogonality, and binary64 underflow/overflow and sheared hierarchy products remain consumers' numerical and representation limits.
 * @evidence contracts/common.md#clear-and-simple-design Three named parts instead of a 4x4 matrix keep each part checkable on its own and decomposable without numerical fitting, and one shape serves every placed record so a single validator covers them all.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The admitted local record has no explicit shear, reflection or collapsed-scale field; this does not certify an arbitrary composed matrix as unsheared or numerically nonsingular. The owning record supplies parent identity and consumers retain their documented matrix/decomposition limits.
 * @evidence contracts/common.md#meaningful-documentation States application order, record owners, semantic joint distinction, unchanged scalar admission and derived-product/hierarchy limitations; members give metre translation, quaternion rotation and dimensionless scale.
 * @author Samchon
 */
export interface IAutoMovieTransform {
  /** Translation in parent space, meters. */
  translation: IAutoMovieVector3;

  /**
   * Rotation as a unit quaternion; transform validation admits a 1e-6 norm tolerance without normalization. Character joint rotation is derived from semantic angles.
   */
  rotation: IAutoMovieQuaternion;

  /**
   * Per-axis scale factor, dimensionless with 1 as identity; uniform scale is { x: s, y: s, z: s }. Admitted components are finite and strictly positive, without a bound on derived-product magnitude.
   */
  scale: IAutoMovieVector3;
}
