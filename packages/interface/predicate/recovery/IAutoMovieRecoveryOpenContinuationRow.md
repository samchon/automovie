# src/recovery/IAutoMovieRecoveryOpenContinuationRow.ts#IAutoMovieRecoveryOpenContinuationRow

## @evidence contracts/development/common.md#meaningful-documentation

The in-progress observation row distinguishes usable raw-bound arcs, their saved ordinals, missing saved curves and defective raw support.

## @evidence contracts/development/design.md#principled-representation

An arc is admitted only when its name/ordinal and both endpoint positions bind to the saved coefficients. Its raw face incidence remains independent of the saved cubic representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The observer keeps at most the current/prior cut rows. Saved output keeps mapped adjacency indices and orientation, while this row holds cut-local evidence.

# src/recovery/IAutoMovieRecoveryOpenContinuationRow.ts#IAutoMovieRecoveryOpenContinuationRow.arcs

## @evidence contracts/development/common.md#meaningful-documentation

Only matching open raw contours with at least two points and identical stored endpoints enter this population.

# src/recovery/IAutoMovieRecoveryOpenContinuationRow.ts#IAutoMovieRecoveryOpenContinuationRow.ordinals

## @evidence contracts/development/common.md#meaningful-documentation

The observer appends a saved report index as it appends each matched raw incidence record.

# src/recovery/IAutoMovieRecoveryOpenContinuationRow.ts#IAutoMovieRecoveryOpenContinuationRow.missing

## @evidence contracts/development/common.md#meaningful-documentation

After the cut, the observer finds every saved report index absent from the matched population.

# src/recovery/IAutoMovieRecoveryOpenContinuationRow.ts#IAutoMovieRecoveryOpenContinuationRow.defects

## @evidence contracts/development/common.md#meaningful-documentation

Closed, degenerate, unallocated or endpoint-mismatching raw cuts contribute their observed face support here.
