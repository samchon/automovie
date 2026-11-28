# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration

## @evidence contracts/development/common.md#meaningful-documentation

The report distinguishes a registered source, insufficient support, same-revision refusal and an unattempted source. Historical work is addressable through its attempt index.

## @evidence contracts/development/design.md#principled-representation

The final state combines source-order pose presence, current candidate count, and the latest attempt's revision. Previous-refusal history can remain when the current support changes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Registration summarizes coverage and points to the ledger. Poses stay in the accepted checkpoint, and attempt diagnostics own detailed fit reports.

# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration.viewIndex

## @evidence contracts/development/common.md#meaningful-documentation

The result creates one registration record per source-order pose slot, including null slots.

# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration.status

## @evidence contracts/development/common.md#meaningful-documentation

A non-null pose is registered. An empty seed, inadequate support, and a same-revision attempted refusal select separate remaining states.

# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration.candidates

## @evidence contracts/development/common.md#meaningful-documentation

Current support is recollected after each accepted checkpoint and is then used to describe the final source state.

# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration.lastAttempt

## @evidence contracts/development/common.md#meaningful-documentation

The description indexes the last recorded attempt regardless of whether its revision matches the final component.

# src/recovery/IAutoMovieRecoverySceneRegistration.ts#IAutoMovieRecoverySceneRegistration.reasons

## @evidence contracts/development/common.md#meaningful-documentation

The summary copies a same-revision attempt's reasons when current support permits an attempt. Otherwise it states the current capacity, seed, or support cause.
