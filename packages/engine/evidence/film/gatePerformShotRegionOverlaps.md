# src/film/gatePerformShotRegionOverlaps.ts#gatePerformShotRegionOverlaps

## @evidence contracts/development/implementation.md#principled-implementation

Compares the masked content each clip actually authors, the same masking the performance builder applies, instead of comparing region names, so the verdict matches what the compiled performance would overwrite; pairs are found by a sweep over actions sorted by start, stopping a row as soon as a later start passes the current end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A gate of its own because it is the only one that synthesizes; span, actor and region rules are the shared `performShotActionSpan`, `performShotActors` and `actionRegion`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actor and verb is compared by the same content rule; the tolerance is one fixed `1e-9` s against floating start arithmetic, and no pair is exempted by its region names.

## @evidence contracts/development/common.md#meaningful-documentation

States why content rather than regions is compared, what counts as carried content, the overlap tolerance, the violation's path and listing order, and why the gate is skipped after an earlier violation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Grouping visits action-to-actor membership, then each actor sorts actions by start and sweeps overlapping pairs, quadratic when all overlap. Each action's content is computed once per actor by traversing synthesized keyframes/joints; arbitrary synthesizer work is additional, and shared-channel diagnostic ordering adds sorting and text costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each action's synthesis comes from the shot's memoized synthesizer, so the clips made here are the clips the performance compile later reuses, and each action's masked content is cached per actor across all its pairs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The per-actor lists and content caches are dropped on return; synthesized clips stay in the caller's memo for the rest of the call.
