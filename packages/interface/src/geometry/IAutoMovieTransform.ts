import type { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A translation, rotation and scale transform placing something in its parent's
 * space.
 *
 * A local point is scaled, then rotated, then translated. Matrix4.compose
 * builds T · R · S in the glTF/three.js convention; nodes, cameras, lights,
 * bones, model parts, attachments and a pose's root carry this record. Joint
 * articulation instead uses semantic angles through
 * {@link IAutoMovieJointPose}.
 *
 * ValidateTransformScalars, used by model, pose, affordance, building and
 * scene-artifact admission, refuses nonfinite components, a quaternion norm
 * more than 1e-6 from one and nonpositive scale components without repairing
 * the record. These scalar checks do not guarantee finite derived products, a
 * representable inverse or an exactly decomposable hierarchy: rotating a child
 * under nonuniform parent scale can introduce shear.
 */
export interface IAutoMovieTransform {
  /** Translation in parent space, meters. */
  translation: IAutoMovieVector3;

  /**
   * Rotation as a unit quaternion; transform validation admits a 1e-6 norm
   * tolerance without normalization. Character joint rotation is derived from
   * semantic angles.
   */
  rotation: IAutoMovieQuaternion;

  /**
   * Per-axis scale factor, dimensionless with 1 as identity; uniform scale is {
   * x: s, y: s, z: s }. Admitted components are finite and strictly positive,
   * without a bound on derived-product magnitude.
   */
  scale: IAutoMovieVector3;
}
