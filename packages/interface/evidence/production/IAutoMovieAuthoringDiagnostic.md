# src/production/IAutoMovieAuthoringDiagnostic.ts#IAutoMovieAuthoringDiagnostic

## @evidence contracts/development/design.md#principled-representation

A fact, impact and recovery triple per failure, keyed by a closed code and phase, so an author or agent can act on each diagnostic without parsing prose, and a lower-gate violation is kept verbatim in `violation` rather than re-derived.

## @evidence contracts/development/design.md#minimal-and-owned-surface `code` classifies the kind of failure and `phase` names who owns the correction; they stay separate because one code, `contract-mismatch` or `pipeline-failed`, is filed in more than one phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unexpected exception becomes `pipeline-failed` with its name and message in `fact` rather than being swallowed or retried, and the engine never edits the source to make a diagnostic disappear.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its result type, the first-failing-phase rule, which code is filed in which phases, what each text field must contain, and when `violation` is present.
