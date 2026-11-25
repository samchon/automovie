# src/physics/physicalShapeSegmentDistance.ts#physicalShapeSegmentDistance

## @evidence contracts/development/implementation.md#principled-implementation

The same physicalShapeQuery numerical owner as the full nearest reading, in scalar mode; it omits only unobserved final fields and preserves the actual signed distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar-mode delegation to the shared query; curlChainUntilContact and motion colliders keep their existing distance-only facade.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, cast or branch; the value is the owner's.

## @evidence contracts/development/implementation.md#efficient-algorithms

The shared query's shape/segment work, without unobserved final contact materialization; hull work still depends on its faces and edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full nearest and distance-only reads share one query implementation and private shape-distance owners without a cross-query cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; its temporaries die with the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the sign, the point case and which owner computes the reading.
