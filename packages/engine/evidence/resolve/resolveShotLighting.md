# src/resolve/resolveShotLighting.ts#resolveShotLighting

## @evidence contracts/development/implementation.md#principled-implementation

Sample admitted light clips, parse stable pointers, require existing capable targets and accumulate overrides before kind-specific reconstruction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The canonical property table owns axis writers and applyLightOverride owns light shape; this pass joins numerical samples to staged ids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Shot admission forbids repeated properties across clips; unadmitted direct duplicates use producer overwrite. Unsupported targets throw and untouched lights retain identity.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state staged order, untouched reference reuse, admitted pointers and sampleClip's before/after-key clamping.

## @evidence contracts/development/implementation.md#efficient-algorithms

L lights build a lookup/output array, all key payloads are sampled/validated, and touched lights receive fixed-size overrides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One light index/override map serves all tracks, sharing unanimated staged fields without a persistent time cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns new light wrappers/array and borrows unchanged records; local maps release on failure/return without native light handles or tasks.
