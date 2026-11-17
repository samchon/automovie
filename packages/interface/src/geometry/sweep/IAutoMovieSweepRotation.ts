

/** Data and callback contracts shared by the SweepRotation operations. */
export namespace IAutoMovieSweepRotation {
  /**
   * Write the product `a b`.
   */
  export type IMultiplyOut = { [index: number]: number };

  /**
   * Scale a quaternion to unit length in place; a zero quaternion becomes the identity.
   */
  export type INormalizeQ = { [index: number]: number };

  /**
   * Write the inverse of a unit quaternion, its conjugate.
   */
  export type IConjugateOut = { [index: number]: number };

  /**
   * Write the unit quaternion of the rotation taking `+X`, `+Y`, `+Z` to three orthonormal columns stored at `xi`, `yi` and `zi`.
   */
  export type IFromBasisOut = { [index: number]: number };

  /**
   * Write a vector rotated by a unit quaternion.
   */
  export type IRotateOut = { [index: number]: number };

  /**
   * Write the spherical interpolation from `a` to `b` at `t`, along the shorter arc.
   */
  export type ISlerpOut = { [index: number]: number };
}
