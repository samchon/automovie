# src/math/nearestHullEdge.ts#nearestHullEdge

## @evidence contracts/development/implementation.md#principled-implementation

A complete boundary scan minimizes horizontal segment distance, retaining the first equal-distance edge; singleton and two-vertex hulls have explicit degenerate edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared XZ projection owns witnesses while this function owns edge selection for toppling and hull-distance consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vertex-only shortcut substitutes for edge distance; each admitted boundary edge receives the same projection.

## @evidence contracts/development/common.md#meaningful-documentation

States horizontal metric, toppling meaning, endpoint aliases, first-edge ties and singleton/empty behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

For H hull corners, H constant-size edge queries take O(H) time with constant live best-edge storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Selection and distance measurement share one scan; a changed query point requires another boundary search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the current best record remains during the call; its returned endpoints alias source vertices rather than copying hull geometry.
