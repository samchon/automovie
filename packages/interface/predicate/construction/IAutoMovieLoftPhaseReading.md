# src/construction/IAutoMovieLoftPhaseReading.ts#IAutoMovieLoftPhaseReading

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the frame, derivative axis, result ownership and the collapsed-tip convention.

## @evidence contracts/development/design.md#principled-representation

Point and cap phase readers place the local section into its actual frame and apply relief to the point and tangent. The original cap reader gives the retained point and zero tangent at a collapsed tip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The phase result carries the two quantities needed at a fixed station, including at value-only cap tips. The full jet carries physical-station derivatives for callers that require them.

# src/construction/IAutoMovieLoftPhaseReading.ts#IAutoMovieLoftPhaseReading.p

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the coordinate frame and includes the applied displacement.

# src/construction/IAutoMovieLoftPhaseReading.ts#IAutoMovieLoftPhaseReading.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the derivative coordinate and why readers keep its magnitude.
