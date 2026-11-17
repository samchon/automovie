import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Affine decomposition values returned by the engine's Matrix4 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Affine decomposition values returned by the engine's Matrix4 operations. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The decomposition joins destination-frame translation, quaternion orientation and dimensionless scale.
 * @evidence contracts/development/design.md#minimal-and-owned-surface World-driver consumers read the existing vector/quaternion types through IDecomposeResult.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not represent shear or certify an arbitrary matrix's right-handedness and finite arithmetic.
 */
export namespace IAutoMovieMatrix4 {
  /**
   * Fresh mutable translation, orientation and scale records extracted from a column-major affine matrix. For finite, right-handed unsheared inputs with representable column norms, composition reproduces each nonzero basis column to rounding. Mirrored or sheared inputs have no exact decomposition here and may produce a nonunit approximate rotation; decompose performs no admission and extreme finite components can overflow a column norm.
   *
   * Collapsed columns are completed from surviving axes: two survivors use their right-handed cross product, one uses the shortest-arc rotation from its canonical axis, and no survivors use identity. Tiny nonzero columns are divided by their own length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States coordinate units, fresh ownership, collapse conventions and the unsupported shear/reflection cases.
   * @evidence contracts/development/design.md#principled-representation Three canonical records express affine TRS; positive-scale authored validation elsewhere supplies the unsheared right-handed premise, which this structural result cannot enforce.
   * @evidence contracts/development/design.md#minimal-and-owned-surface World-space aim, parent and IK drivers read these components and recompose their matrices; no new vector or quaternion representation is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scale magnitudes do not encode mirror signs, and the output is not an exact shear decomposition or an input-validation verdict.
   */
  export type IDecomposeResult = {
    /** Matrix translation entries 12..14 in the matrix's destination frame and length unit; world metres for a world transform. */
    position: IAutoMovieVector3;

    /** Dimensionless x,y,z,w orientation in the matrix destination frame; finite unit length requires unsheared right-handed input and representable column normalization. */
    rotation: IAutoMovieQuaternion;

    /** Nonnegative dimensionless lengths of the three basis columns; zero represents a collapsed axis. */
    scale: IAutoMovieVector3;
  };
}
