# src/recovery/IAutoMovieRecoveryOpenContinuationEdge.ts#IAutoMovieRecoveryOpenContinuationEdge

## @evidence contracts/development/common.md#meaningful-documentation

The resolved edge keeps both saved addresses, the reversal bit and its ordinal in the source adjacency record.

## @evidence contracts/development/design.md#principled-representation

Outward and inward maps share one immutable edge keyed by the corresponding arc address. Direction changes are explicit rather than rewriting a saved curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Local continuation preparation validates the graph and derives the edge maps. The saved bundle retains cubic coefficient ownership.

# src/recovery/IAutoMovieRecoveryOpenContinuationEdge.ts#IAutoMovieRecoveryOpenContinuationEdge.before

## @evidence contracts/development/common.md#meaningful-documentation

The preparer uses the verified earlier station index and the pair's original before-arc ordinal.

# src/recovery/IAutoMovieRecoveryOpenContinuationEdge.ts#IAutoMovieRecoveryOpenContinuationEdge.after

## @evidence contracts/development/common.md#meaningful-documentation

The farther endpoint is recorded at that verified adjacent station with its original open-curve ordinal.

# src/recovery/IAutoMovieRecoveryOpenContinuationEdge.ts#IAutoMovieRecoveryOpenContinuationEdge.reverse

## @evidence contracts/development/common.md#meaningful-documentation

The preparer copies the observed reverseAfter flag. A traversed run can combine it with earlier direction state.

# src/recovery/IAutoMovieRecoveryOpenContinuationEdge.ts#IAutoMovieRecoveryOpenContinuationEdge.pairOrdinal

## @evidence contracts/development/common.md#meaningful-documentation

The preparation iterates original pair positions, preserving the address that analytic ownership can use.
