import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Correspondence inputs and centered rigid-transform output of fitRigidMeshTransform.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Correspondence inputs and centered rigid-transform output of fitRigidMeshTransform. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Selected XYZ correspondences and quaternion/centroid results retain input coordinate units and frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Rigid fitting callers share canonical vectors and quaternions rather than a separate mesh representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A proper rigid fit excludes scaling and reflection but does not certify nonpenetration or joint feasibility.
 */
export namespace IAutoMovieFitRigidMeshTransform {
  /**
   * Corresponding XYZ clouds and a nonempty selection for a least-squares proper rotation at fixed scale one. Inputs are read without mutation or retention. Horn's quaternion eigensystem and fixed Jacobi sweep order choose a deterministic optimum; collapsed covariance selects identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes correspondence, shared units, selected-coordinate admission, borrowed buffers and degenerate fitting.
   * @evidence contracts/development/design.md#principled-representation Flat buffers use the same length unit and compatible frames; vertex ordinals address triples. Runtime checks equal triple-aligned lengths and distinct resident selected vertices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Facial rigid-component and carried-body fitting reuse existing arrays and selections without another mesh representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only selected coordinates are checked for finiteness; invalid selections or nonrepresentable centering throw. No scale, reflection, joint-feasibility or nonpenetration certificate is supplied.
   */
  export type IProps = {
    /** Borrowed source x,y,z triples; unselected coordinates are not checked for finiteness. */
    reference: readonly number[];

    /** Corresponding destination triples with exactly the reference length and the same length unit. */
    target: readonly number[];

    /** Nonempty distinct integer vertex indices resident in both buffers; their selected coordinates must be finite. */
    vertices: readonly number[];
  };

  /**
   * Fresh mutable quaternion and centroid records. Transform p as rotation * (p - referenceCenter) + targetCenter; centered application avoids cancellation between large absolute coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives application order, ownership and centroid units.
   * @evidence contracts/development/design.md#principled-representation A unit quaternion and two input-unit centroids express only a proper rigid fit between the input frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumers apply centered rotations directly, without an affine matrix or cancellation-prone translation vector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate correspondences can have multiple optima; the returned deterministic rotation carries no physical motion or nonpenetration verdict.
   */
  export type IResult = {
    /** Unit x,y,z,w quaternion mapping centered reference directions to target directions; identity for collapsed covariance. */
    rotation: IAutoMovieQuaternion;

    /** Arithmetic centroid of selected reference vertices, in reference-frame input units. */
    referenceCenter: IAutoMovieVector3;

    /** Arithmetic centroid of selected target vertices, in target-frame input units. */
    targetCenter: IAutoMovieVector3;
  };
}
