/** Caller-managed numeric destinations for packed quaternion operations. */
export namespace IAutoMovieSweepRotation {
  /**
   * Caller-owned four-component quaternion product destination beginning at a
   * scalar offset.
   *
   * Input and output may share the same storage.
   */
  export type IMultiplyOut = { [index: number]: number };

  /**
   * Writable four-component quaternion storage normalized in place at the
   * supplied offset.
   */
  export type INormalizeQ = { [index: number]: number };

  /** Caller-owned x, y, z, w destination for a unit quaternion conjugate. */
  export type IConjugateOut = { [index: number]: number };

  /**
   * Caller-owned four-component rotation destination for an orthonormal
   * right-handed basis.
   */
  export type IFromBasisOut = { [index: number]: number };

  /**
   * Caller-owned three-component XYZ destination for one quaternion-rotated
   * vector.
   *
   * Supply three writable consecutive scalar positions beginning at the
   * operation's offset.
   */
  export type IRotateOut = { [index: number]: number };

  /**
   * Caller-owned four-component destination for shortest-arc quaternion
   * interpolation.
   *
   * The kernel evaluates the supplied parameter directly, including
   * extrapolation.
   */
  export type ISlerpOut = { [index: number]: number };
}
