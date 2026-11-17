/**
 * Data and callback contracts shared by the SweepRotation operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Caller-owned indexed buffers hold dimensionless x/y/z/w quaternions or three-component vectors at explicit scalar offsets. Index signatures allow shared numeric storage; unit-quaternion, orthonormal-basis and capacity premises belong to each operation, not the storage type.
 * @evidence contracts/development/design.md#principled-representation Caller-owned indexed buffers hold dimensionless x/y/z/w quaternions or three-component vectors at explicit scalar offsets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation writes these buffers during bone, orientation and sweep pose updates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Index signatures allow shared numeric storage; unit-quaternion, orthonormal-basis and capacity premises belong to each operation, not the storage type.
 */
export namespace IAutoMovieSweepRotation {
  /**
   * Caller-owned output for four x/y/z/w Hamilton-product components at the operation's scalar offset; a*b applies b first. Inputs may alias this output.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four writable slots at the supplied scalar offset receive the dimensionless quaternion in x/y/z/w order for Hamilton product a*b, applying b first. The output is not normalized automatically; capacity and any unit-quaternion requirement belong to the caller.
   * @evidence contracts/development/design.md#principled-representation Four writable slots at the supplied scalar offset receive the dimensionless quaternion in x/y/z/w order for Hamilton product a*b, applying b first.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.multiply writes caller storage after reading both operands, permitting output/input aliasing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The output is not normalized automatically; capacity and any unit-quaternion requirement belong to the caller.
   */
  export type IMultiplyOut = { [index: number]: number };

  /**
   * Caller-owned x/y/z/w quaternion storage normalized in place at the supplied scalar offset. Zero norm becomes identity; the caller supplies four writable slots.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four writable x/y/z/w slots at the supplied offset are both quaternion input and normalized dimensionless output. Zero norm becomes identity by the quaternion convention; this storage shape does not prevent nonfinite components or insufficient capacity.
   * @evidence contracts/development/design.md#principled-representation Four writable x/y/z/w slots at the supplied offset are both quaternion input and normalized dimensionless output.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.normalize updates this caller-owned storage in place and retains no buffer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero norm becomes identity by the quaternion convention; this storage shape does not prevent nonfinite components or insufficient capacity.
   */
  export type INormalizeQ = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for a unit quaternion's conjugate, at the supplied scalar offset. Input and output may share storage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four writable x/y/z/w slots at the output offset receive a dimensionless unit quaternion's conjugate. Conjugation is an inverse only for unit input; the storage type neither normalizes nor admits that premise.
   * @evidence contracts/development/design.md#principled-representation Four writable x/y/z/w slots at the output offset receive a dimensionless unit quaternion's conjugate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.conjugate reads its quaternion before writing, permitting shared input/output storage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Conjugation is an inverse only for unit input; the storage type neither normalizes nor admits that premise.
   */
  export type IConjugateOut = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for the rotation taking +X,+Y,+Z to an admitted orthonormal basis. The kernel writes at the supplied scalar offset and normalizes the result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four writable x/y/z/w slots receive the normalized quaternion mapping +X,+Y,+Z to the supplied basis columns. The input basis must be orthonormal; output normalization does not establish that premise or validate buffer capacity.
   * @evidence contracts/development/design.md#principled-representation Four writable x/y/z/w slots receive the normalized quaternion mapping +X,+Y,+Z to the supplied basis columns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.fromBasis converts existing frame storage into this caller-owned output without retaining it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The input basis must be orthonormal; output normalization does not establish that premise or validate buffer capacity.
   */
  export type IFromBasisOut = { [index: number]: number };

  /**
   * Caller-owned three-slot XYZ output at a scalar offset, retaining the input vector's length unit. A unit quaternion rotates the vector, and input/output storage may alias.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Three writable XYZ slots at the output offset receive a rotated vector in its original length unit. The quaternion must be unit length; the storage interface does not encode finite inputs, frame compatibility or available capacity.
   * @evidence contracts/development/design.md#principled-representation Three writable XYZ slots at the output offset receive a rotated vector in its original length unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.rotate reads the vector before writing, so caller storage can be rotated in place.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The quaternion must be unit length; the storage interface does not encode finite inputs, frame compatibility or available capacity.
   */
  export type IRotateOut = { [index: number]: number };

  /**
   * Caller-owned four-slot x/y/z/w output for shortest-arc interpolation of unit quaternions at dimensionless t. The output offset is scalar, and t is not clamped by the kernel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Four writable dimensionless x/y/z/w slots receive shortest-arc interpolation at the caller's dimensionless t. The kernel assumes unit operands and does not clamp t; capacity and interpolation-domain admission remain with callers.
   * @evidence contracts/development/design.md#principled-representation Four writable dimensionless x/y/z/w slots receive shortest-arc interpolation at the caller's dimensionless t.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieSweepRotation.slerp reads both operands before writing and uses the shared near-parallel normalization convention.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The kernel assumes unit operands and does not clamp t; capacity and interpolation-domain admission remain with callers.
   */
  export type ISlerpOut = { [index: number]: number };
}
