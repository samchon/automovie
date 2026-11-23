# src/architecture/builtEnvironmentPlacementBounds.ts#builtEnvironmentPlacementBounds

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `resolveBuiltPlacementBody` with the single-element part query as its part source, so the element box is the union of its measured static CPU part boxes and the basis is read from whether that union is one point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single-body entry point over the shared body resolution, which the pairwise and sweep overlap queries also use, so the three answer one rule for what a body's box is.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element, population or caller; the null answers and the origin-point label are stated rules, and the population fold's `along-route` refusal passes through.

## @evidence contracts/development/common.md#meaningful-documentation

States how each locator kind is measured, that populations stay compact and when their fold throws, both null cases, and what the `element-origin-point` basis tells the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

An element pays the element/model scans, world staging and part tessellation/fold of `builtEnvironmentElementPartBounds`, then its part union. A population pays an O(R) scan of R populations plus `builtInstanceSetPlacementBounds`, including validation of all stored explicit transforms and a fold over the first count transforms.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one locator per call and caches nothing across calls; the building-wide sweep resolves every body from one part table instead of calling this per body.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the caller owns the returned box.
