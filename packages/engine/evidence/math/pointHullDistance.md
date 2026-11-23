# src/math/pointHullDistance.ts#pointHullDistance

## @evidence contracts/development/implementation.md#principled-implementation

Convex counter-clockwise half-planes decide interior zero distance; outside points use the nearest horizontal boundary, with explicit empty, point and segment degeneracies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

pointInHull and nearestHullEdge own containment and boundary selection, while this adapter supplies support-distance meaning.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty hull yields Infinity rather than invented support, and degenerate hulls keep their actual point or segment geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States XZ distance, zero interior value, empty Infinity result and singleton/segment interpretations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Containment and any required boundary scan each cost O(H); interior queries skip projection work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The containment verdict skips edge distances for interior points, without caching mutable support coordinates across requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar distance escapes; any boundary record is temporary and no hull or query reference remains.
