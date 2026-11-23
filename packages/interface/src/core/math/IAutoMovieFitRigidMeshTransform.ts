import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Correspondence inputs and centered rigid-transform output of
 * fitRigidMeshTransform.
 */
export namespace IAutoMovieFitRigidMeshTransform {
  /**
   * Corresponding XYZ clouds and a nonempty selection for a least-squares
   * proper rotation at fixed scale one. Inputs are read without mutation or
   * retention. Horn's quaternion eigensystem and fixed Jacobi sweep order
   * choose a deterministic optimum; collapsed covariance selects identity.
   */
  export type IProps = {
    /**
     * Borrowed source x,y,z triples; unselected coordinates are not checked for
     * finiteness.
     */
    reference: readonly number[];

    /**
     * Corresponding destination triples with exactly the reference length and
     * the same length unit.
     */
    target: readonly number[];

    /**
     * Nonempty distinct integer vertex indices resident in both buffers; their
     * selected coordinates must be finite.
     */
    vertices: readonly number[];
  };

  /**
   * Fresh mutable quaternion and centroid records. Transform p as rotation * (p
   * - referenceCenter) + targetCenter; centered application avoids cancellation
   * between large absolute coordinates.
   */
  export type IResult = {
    /**
     * Unit x,y,z,w quaternion mapping centered reference directions to target
     * directions; identity for collapsed covariance.
     */
    rotation: IAutoMovieQuaternion;

    /**
     * Arithmetic centroid of selected reference vertices, in reference-frame
     * input units.
     */
    referenceCenter: IAutoMovieVector3;

    /**
     * Arithmetic centroid of selected target vertices, in target-frame input
     * units.
     */
    targetCenter: IAutoMovieVector3;
  };
}
