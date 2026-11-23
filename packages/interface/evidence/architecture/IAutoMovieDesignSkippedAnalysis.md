# src/architecture/IAutoMovieDesignSkippedAnalysis.ts#IAutoMovieDesignSkippedAnalysis

## @evidence contracts/development/design.md#principled-representation `promoteDesignObservations` copies the analysis id, its outcome status, and its outcome reason for every analysis whose status is not `observed`; `validateDesignReference` has already required that reason to be non-blank.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields restate the analysis outcome in the promotion result, so a caller reads every empty reading from one list without walking the reference again.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reason is carried verbatim rather than rewritten into a generic message, and an empty analysis is listed rather than filtered out of the result.

## @evidence contracts/development/common.md#meaningful-documentation

States which analyses produce an entry and in what order, the two statuses an entry can carry, and that the reason is the analysis' own text.
