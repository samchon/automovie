
/**
 * Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is null, which never counts as finite support for the planar competitor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is
 * @evidence contracts/development/design.md#principled-representation Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureRecoveryHomographyErrors share IAutoMovieRecoveryHomographyErrorsMeasurementOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryHomographyErrorsMeasurementOperation {
/**
 * Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is null, which never counts as finite support for the planar competitor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is
 * @evidence contracts/development/design.md#principled-representation Measure the root-mean-square forward/backward homography transfer in pixels. A mapped point on the projective horizon or an unrepresentable transfer is
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureRecoveryHomographyErrors share IAutoMovieRecoveryHomographyErrorsMeasurementOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (model: {
 /** Row-major 3 by 3 image-to-image projective map in the declared pixel charts. */
matrix: readonly number[];
 /** Row-major inverse of the admitted image-to-image homography. */
inverse: readonly number[] },
first: readonly (readonly [number, number])[],
second: readonly (readonly [number, number])[]) => (number | null)[];
}

