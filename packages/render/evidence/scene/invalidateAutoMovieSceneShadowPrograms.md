# src/scene/invalidateAutoMovieSceneShadowPrograms.ts#invalidateAutoMovieSceneShadowPrograms

## @evidence contracts/development/implementation.md#principled-implementation

Collects unique actual scene/override materials and marks their public needsUpdate boundary after effective shadow state changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shadow-state application owns deciding when invalidation is needed; this helper owns only deduplicated material notification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Three cache key, method or native program is replaced, and shared materials receive one update request regardless of scene aliases.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation identifies effective shadow enable/filter changes, supported material notification and SDK program-key ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

One N-object traversal and M-material Set cost O(N+M) expected work with O(M) temporary references; full scan is needed to discover shared scene materials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Set identity reuses each material within this invalidation, while native program reuse remains Three's responsibility after notified state changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Materials are borrowed and the temporary Set leaves the call; no shader program is acquired/disposed or retained in this helper.
