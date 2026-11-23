# src/internal/differentiateRecoveryMapProjection.ts#differentiateRecoveryMapProjection

## @evidence contracts/development/implementation.md#principled-implementation

Quotient Hessians compose with left-Exp rotation, independent additive translation and world points. The seed uses Exp(omega)R(X+dX)+r*normalize(t+Bz), r=norm(t) fixed at the current base. Its actual first derivative is P_t B and second derivative r*D2N(t)[B_i,B_j]; current pixels remain RX+t without an exact-unit or exact-orthonormal assumption.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This optional second-order geometry owner returns one at-most-nine-dimensional local record; the existing projection/linearization continues to own original physical rows and rank data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite differences, known Hessian, pose differencing, depth clamp or exception catch supplies curvature. Nonrepresentable arithmetic returns null before model selection; malformed chart dimensions throw.

## @evidence contracts/development/common.md#meaningful-documentation

Local order is rotation, raw translation coefficients or additive translation, then world point. The seed shares the map's current-radius zero/first/second chart; lagged multipliers and Float arithmetic still supply no exact current-KKT Hessian, uniform accuracy or conditioning certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed dimensions at most9 bound coordinate formation and two pixel Hessians by constant work per observation, within the caller's prepaid131072 visit allowance. Three-term coordinate and nine-term quotient contractions require no full-state matrix.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current rotated point, depth, quotient derivatives and one chart differential supply both pixels and all local first/second derivatives in this separately charged geometry pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed scratch holds at most3x9 first and3x9x9 second coordinate entries beside two9x9 output Hessians and two3-coordinate seed differential tuples. This remains within the admitted optional local scratch; all scratch expires at return and the caller consumes one record before the next observation.
