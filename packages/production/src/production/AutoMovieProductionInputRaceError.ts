/**
 * A guarded project operation no longer observes its admitted input generation.
 *
 * Project transactions use this boundary identity when revision, root, namespace or input checks refuse. Compilation converts it to a source-attributed result only if the current revision can still be observed; otherwise the formatter preserves both causes, while transaction owners determine whether changes were applied or restored.
 *
 * @evidence contracts/common.md#principled-implementation A distinct Error subtype marks guarded-input replacement so compilation can classify that boundary failure without confusing arbitrary reader failures with a safe race refusal.
 * @evidence contracts/common.md#clear-and-simple-design The subtype carries the ordinary error message and separates race handling through instanceof; the transaction and compiler owners retain recovery and aggregate-cause decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An arbitrary thrown error is not relabeled as an input race, and no changed input is accepted through retry or fallback in this marker.
 * @evidence contracts/common.md#meaningful-documentation States the guarded root, namespace, revision and input changes it represents, plus the condition for source-attributed conversion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This marker adds no algorithm beyond ordinary Error construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Error instances name individual failed observations and coordinate no repeated work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The thrown error transfers to its catching caller and retains no project, file handle or task beyond ordinary error metadata.
 */
export class AutoMovieProductionInputRaceError extends Error {}
