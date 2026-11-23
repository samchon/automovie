# src/film/normalizeAudioAssets.ts#normalizeAudioAssets

## @evidence contracts/development/implementation.md#principled-implementation

Code-unit order is locale-independent and total over distinct paths, and the duration check compares the stored seconds with the same IEEE division that produced them, so an exact record passes and any edited count or duration is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sort and one validating copy produce the plan's asset list; the WAVE-specific relations live in `validWaveAudioIdentity` and the digest grammar in `validDigest`, so this function holds only the provenance-independent rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The placeholder format is typed from `IAutoMovieProductionSoundPlan`'s fixed rate and channel count rather than chosen here, no path is special-cased, and an invalid asset throws rather than being dropped.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the ordering and why, every refusal, the placeholder format, and that the input is left unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

For A assets the cost is an O(A log A) sort plus one O(1) set lookup and constant checks per asset and one deep copy of each identity; the sort is needed because the order is part of the plan bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The planner calls it once per plan on that plan's own inputs, so there is no completed equivalent work to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The path set and the sorted array are local and released on return; the returned copies, owned by the caller, hold one record per asset and no handle or task.
