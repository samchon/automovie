# src/recovery/computation/IAutoMovieRecoveryFeasibleStateRefinementOperation.ts#IAutoMovieRecoveryFeasibleStateRefinementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Documents parameter units, callback effects and failed admission for refineRecoveryFeasibleState.

## @evidence contracts/development/design.md#principled-representation

Refine one caller-defined State while preserving the correlation between the problem callbacks and returned state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

refineRecoveryFeasibleState and its typed callers share this signature and the referenced canonical input and result records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical qualification and caller budget admission remain required by refineRecoveryFeasibleState; the type does not certify input validity.
