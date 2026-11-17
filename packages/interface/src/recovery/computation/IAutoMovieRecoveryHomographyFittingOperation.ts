
/**
 * Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image pixel centres to second-image pixel centres; it does not identify scene depth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image
 * @evidence contracts/development/design.md#principled-representation Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryHomography, fitRecoveryHomographyConsensus share IAutoMovieRecoveryHomographyFittingOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryHomographyFittingOperation {
/**
 * Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image pixel centres to second-image pixel centres; it does not identify scene depth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image
 * @evidence contracts/development/design.md#principled-representation Fit a normalized DLT image homography and its independently representable inverse for a competing planar/pure-rotation explanation. It maps first-image
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryHomography, fitRecoveryHomographyConsensus share IAutoMovieRecoveryHomographyFittingOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (first: readonly (readonly [number, number])[],
second: readonly (readonly [number, number])[],
minimumRatio: number,
maxSweeps: number) => {
 /** Row-major 3 by 3 image-to-image projective map in the declared pixel charts. */
matrix: number[];
 /** Row-major inverse of the admitted image-to-image homography. */
inverse: number[];
 /** Measured smallest over largest relevant design singular value; dimensionless rank evidence. */
designSingularRatio: number };
}

