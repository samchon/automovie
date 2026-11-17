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
 *
 * @evidence contracts/development/design.md#principled-representation Four ordered unitless components represent a rotation with a unit-norm premise that TypeScript cannot enforce.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Human skeleton transforms and their numerical helpers share the tuple; the object contract is not replaced by a cast.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default identity, automatic normalization, fixed bone or implicit frame conversion is promised.
 * @evidence contracts/development/common.md#meaningful-documentation States component order, norm and sign semantics, field-owned frames, mutability and caller validation responsibility.
 */
export type AutoMovieQuaternionTuple = [x: number, y: number, z: number, w: number];
