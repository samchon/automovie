/** Data and callback contracts shared by the SweepRotation operations. */
export namespace IAutoMovieSweepRotation {
  /**
   * Caller-owned output for four x/y/z/w Hamilton-product components at the
   * operation's scalar offset; a*b applies b first. Inputs may alias this
   * output.
   */
  export type IMultiplyOut = { [index: number]: number };

  /**
   * Caller-owned x/y/z/w quaternion storage normalized in place at the supplied
   * scalar offset. Zero norm becomes identity; the caller supplies four
   * writable slots.
   */
  export type INormalizeQ = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for a unit quaternion's conjugate, at
   * the supplied scalar offset. Input and output may share storage.
   */
  export type IConjugateOut = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for the rotation taking +X,+Y,+Z to
   * an admitted orthonormal basis. The kernel writes at the supplied scalar
   * offset and normalizes the result.
   */
  export type IFromBasisOut = { [index: number]: number };

  /**
   * Caller-owned three-slot XYZ output at a scalar offset, retaining the input
   * vector's length unit. A unit quaternion rotates the vector, and
   * input/output storage may alias.
   */
  export type IRotateOut = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for shortest-arc interpolation of
   * unit quaternions at dimensionless t. The output offset is scalar, and t is
   * not clamped by the kernel.
   */
  export type ISlerpOut = { [index: number]: number };
}
