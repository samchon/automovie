# src/geometry/collectAutoMovieSpatialQueryCandidates.ts#collectAutoMovieSpatialQueryCandidates

## @evidence contracts/development/implementation.md#principled-implementation

Positive division and floor are monotone, so a node's cell range encloses each descendant's, and a node disjoint from the subject in either the coordinate or the cell sense cannot hide a qualifying entry; the walk is an explicit stack visiting each node once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared spatial reader compares actual coordinates for overlap and cell coordinates for neighbourhoods. The public collector applies the same order to either population. A pure per-triangle self crossing census can use the internal traversal and rank its actual witnesses separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pruning uses the same enclosure predicate as the leaf test, so nothing is skipped that the population rule would keep, and the cell width only orders or groups entries, never moves them.

## @evidence contracts/development/common.md#meaningful-documentation

States the tree and frame, both populations and who reads each, the ordering and its tie-break, why work does not depend on coordinate magnitude, and that geometry is untouched.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n resident entries and k qualifying ones, the walk visits only nodes whose boxes reach the subject, O(k log n) for a local subject and O(n) at worst, then sorts k candidates in O(k log k) with at most three cell divisions per comparison side.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call answers one subject; the tree it walks is the reused, compiled artifact of its caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds a stack of at most the tree's node count and the candidate array, both released or handed to the caller on return; entries are returned by reference, not copied.
