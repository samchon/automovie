# src/curves/AutoMovieRecoveryCompactApproximation.ts#AutoMovieRecoveryCompactApproximation.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

The method accepts one registered planar piece and a normalized parameter, and returns coordinates in its millimetre frame.

## @evidence contracts/development/implementation.md#principled-implementation

For a conic, the rational Bernstein owner evaluates all three weighted controls with the homogeneous denominator. Other pieces use Engine Bernstein scalar evaluation on the two coordinate sequences. Both use the stored chart parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

The evaluation needs only the piece controls and one parameter. It produces a single coordinate pair and retains no source chart.

# src/curves/AutoMovieRecoveryCompactApproximation.ts#AutoMovieRecoveryCompactApproximation.storedScalars

## @evidence contracts/development/common.md#meaningful-documentation

The documentation describes control coordinates, three numeric metadata entries per piece and exact adjacent endpoint sharing.

## @evidence contracts/development/implementation.md#principled-implementation

Each planar control needs two scalars. Adjacent pieces with componentwise equal shared endpoints represent one location, so the second endpoint occurrence contributes no duplicate coordinate. The result counts the declared storage comparison metric.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over saved pieces keeps only the previous endpoint. It does not compare each pair of controls or evaluate source geometry.

# src/curves/AutoMovieRecoveryCompactApproximation.ts#AutoMovieRecoveryCompactApproximation.approximate

## @evidence contracts/development/common.md#meaningful-documentation

The contract states polynomial degree range, conditional conic candidates, sampled qualification unit and the supplied work policy.

## @evidence contracts/development/implementation.md#principled-implementation

Each piece candidate matches approved endpoint positions and tangents. Design rows use sampled source positions and an original-design solve, with separate held-out samples rating residuals. Search and subdivision continue only for an admitted source chart while the query and piece budgets allow. The sampled results bound witnessed correspondence, leaving continuous error outside that claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Source sample values are gathered for required chart intervals and reused within their fits. A supplied query and piece budget limits subdivision and source requests. The result retains selected coefficients and diagnostics.
