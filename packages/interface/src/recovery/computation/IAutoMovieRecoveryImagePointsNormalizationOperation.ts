
/**
 * Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design: https://users.cecs.anu.edu.au/~hartley/Papers/fundamental/fundamental.pdf Coincident or nonrepresentable charts refuse instead of adding an arbitrary spread. This normalization changes a fitting chart, never source pixels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:
 * @evidence contracts/development/design.md#principled-representation Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryEpipolarMatrix, fitRecoveryHomography, normalizeRecoveryImagePoints share IAutoMovieRecoveryImagePointsNormalizationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryImagePointsNormalizationOperation {
/**
 * Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design: https://users.cecs.anu.edu.au/~hartley/Papers/fundamental/fundamental.pdf Coincident or nonrepresentable charts refuse instead of adding an arbitrary spread. This normalization changes a fitting chart, never source pixels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:
 * @evidence contracts/development/design.md#principled-representation Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitRecoveryEpipolarMatrix, fitRecoveryHomography, normalizeRecoveryImagePoints share IAutoMovieRecoveryImagePointsNormalizationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (points: readonly (readonly [number, number])[]) => {
 /** Image coordinates after the admitted centring and scaling transform, in input order. */
points: [number, number][];
 /** Row-major 3 by 3 homogeneous image-coordinate normalization transform. */
transform: number[] };
}

