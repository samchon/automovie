/**
 * Rotation quaternion components in glTF order `[x, y, z, w]`.
 *
 * The first three components are imaginary and the last is scalar. Rotations
 * require unit length; `q` and `-q` describe the same rotation. The containing
 * field identifies the source and destination frames, such as a bone's local
 * frame and its parent frame. Components are unitless, not Euler angles.
 *
 * This mutable tuple is the array representation used by Human skeleton
 * preparation and rigid-transform arithmetic. Readonly inputs use `Readonly`;
 * callers own allocation and mutation as stated by the operation. Neither this
 * type nor a direct arithmetic call implies normalization or runtime admission.
 * `IAutoMovieQuaternion` remains the corresponding named-component record.
 */
export type AutoMovieQuaternionTuple = [
  x: number,
  y: number,
  z: number,
  w: number,
];
