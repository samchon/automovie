
/**
 * Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the two singular values of R give the same direction rank as the original design. Their ratio is a binary64 diagnostic under the supplied numeric threshold, not a certified interval bound or uncertainty distribution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the
 * @evidence contracts/development/design.md#principled-representation Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, createRecoveryImageDirectionSolver share IAutoMovieRecoveryImageDirectionSolverCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryImageDirectionSolverCreationOperation {
/**
 * Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the two singular values of R give the same direction rank as the original design. Their ratio is a binary64 diagnostic under the supplied numeric threshold, not a certified interval bound or uncertainty distribution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the
 * @evidence contracts/development/design.md#principled-representation Factor a two-column camera-direction design without normal equations. Reorthogonalized modified Gram-Schmidt supplies the small QR factors; the
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, createRecoveryImageDirectionSolver share IAutoMovieRecoveryImageDirectionSolverCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (directions: readonly [number, number][],
minimumRatio: number) => {
 /** Dimensionless direction-design singular ratio retained from admission. */
ratio: number;
 /** Solves the admitted direction system for one borrowed observation vector, returning the two physical coefficients. */
solve: (values: readonly number[]) => [number, number] };
}

