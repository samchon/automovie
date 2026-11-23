import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/** Affine decomposition values returned by the engine's Matrix4 operations. */
export namespace IAutoMovieMatrix4 {
  /**
   * Fresh mutable translation, orientation and scale records extracted from a
   * column-major affine matrix. For finite, right-handed unsheared inputs with
   * representable column norms, composition reproduces each nonzero basis
   * column to rounding. Mirrored or sheared inputs have no exact decomposition
   * here and may produce a nonunit approximate rotation; decompose performs no
   * admission and extreme finite components can overflow a column norm.
   *
   * Collapsed columns are completed from surviving axes: two survivors use
   * their right-handed cross product, one uses the shortest-arc rotation from
   * its canonical axis, and no survivors use identity. Tiny nonzero columns are
   * divided by their own length.
   */
  export type IDecomposeResult = {
    /**
     * Matrix translation entries 12..14 in the matrix's destination frame and
     * length unit; world metres for a world transform.
     */
    position: IAutoMovieVector3;

    /**
     * Dimensionless x,y,z,w orientation in the matrix destination frame; finite
     * unit length requires unsheared right-handed input and representable
     * column normalization.
     */
    rotation: IAutoMovieQuaternion;

    /**
     * Nonnegative dimensionless lengths of the three basis columns; zero
     * represents a collapsed axis.
     */
    scale: IAutoMovieVector3;
  };
}
