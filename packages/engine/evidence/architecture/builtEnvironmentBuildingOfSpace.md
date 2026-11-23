# src/architecture/builtEnvironmentBuildingOfSpace.ts#builtEnvironmentBuildingOfSpace

## @evidence contracts/development/implementation.md#principled-implementation

An ancestor walk over a space id index, stopping at the first space a building names as its root; ownership is subtree membership, and since validation makes building roots parentless and ownership unique, the nearest such ancestor is the one owner, while a visited set ends a cyclic chain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Answers from the space's own ancestor chain instead of expanding every building's subtree, and refuses ids through the shared `requireBuiltSpace`, so this query owns only the ownership rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no building or space; an unowned space is refused rather than defaulted to the first building, and nested or cyclic records, which validation refuses, are documented rather than repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States what a building owns, how the owner is found, the validation premises that make it unique, the nearest-root reading and cycle effect on an unvalidated record, and both throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the space and building counts to build the two id indexes, then linear in the space's depth for the walk, replacing a per-building fixed-point subtree expansion that grew with building count times space count times depth.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one space per call over the caller's mutable record and keeps no index between calls; a caller labelling many spaces pays the index build per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The id indexes and visited set live for one call and are dropped on return; the caller owns the returned id string.
