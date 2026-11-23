# src/internal/differentiateRecoveryMapTangent.ts#differentiateRecoveryMapTangent

## @evidence contracts/development/implementation.md#principled-implementation

The normalization chain rule gives B_i-t*(t dot B_i)/norm(t)^2. This actual differential supplies both ordinary and feasible physical rows and the optional curvature's first derivatives without treating an admitted near-unit input as exactly unit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed two-column projection owns the seed chart differential; raw coefficient construction and actual pose updates remain separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No borrowed direction is changed, radius is clamped or numerical input is silently normalized. Malformed dimensions throw; unsupported computed radius/differential returns null for the caller's original arithmetic policy.

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed local radius, raw coefficient meaning and actual first derivative at the original current value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two three-coordinate contractions and projections cost constant work and storage. Map callers prepay512 additional model visits, including validation, both projections and result qualification; optional curvature includes this fixed work in its existing per-observation allowance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The squared radius is shared by both columns, and each column's radial contraction is evaluated once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Two owned tuples transfer; borrowed t and B remain unchanged. The temporary raw/derived overlap and fixed locals fit the separately admitted64-slot chart envelope; no state, image or factor is retained.
