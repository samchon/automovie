# src/geometry/buildAutoMovieMeshQueryHierarchy.ts#buildAutoMovieMeshQueryHierarchy

## @evidence contracts/development/implementation.md#principled-implementation

A median-split bounding-volume hierarchy: node extrema are the componentwise union of entry boxes, so enclosure holds by construction whatever split is chosen, and the median keeps depth logarithmic in the entry count.

`partition` uses a three-way selection around the median rank on the same widest axis. The equal-count split follows [Physically Based Rendering](https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies). Each entry belongs to one leaf and the common union operation gives the exact descendant bounds. Equal centres can fall on either side because the crossing query orders candidates by shared cell and original triangle ordinal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The builder only partitions boxes; admitting entries, reading their geometry and walking the tree belong to the queries, which share this one builder and its `IAutoMovieMeshQueryHierarchy` node type.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box is padded and no entry is dropped or merged, and the leaf size only trades traversal cost; the infinite sentinels of an empty leaf are stated instead of being replaced by a fake box.

## @evidence contracts/development/common.md#meaningful-documentation

States the suppliers and frame, the enclosure guarantee, the in-place sort and the shared small-input array, the split and tie rules, what the leaf size changes, and the empty sentinels.

`partition` documents its finite world boxes, caller-owned scratch array, median rank, exact descendant bounds and the crossing query that supplies candidate order.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n entries each level sorts its span once, O(n log n) per level over O(log n) levels, so O(n log^2 n) time and O(n log n) transient allocation from the per-level slices. Consumers that depend on stable centre ties use this entry point.

`partition` shares one caller-owned scratch array across all child ranges and copies leaf spans into the returned tree. Selection visits at most two original span lengths before sorting the active range, the bound from an ideal halving sequence. The usual time is O(n log n) with O(n log² n) worst-case time when the sort fallback recurs. The returned nodes and leaf entry references take O(n) space. The fallback uses temporary storage for its active range. Current-position refits reuse the caller-owned hierarchy's partition.

On the same saved 571,024-triangle neutral skin, crossing-query preparation took 11.24 s in both original trials and 4.62–5.40 s in three partition trials. Preparation and traversal together took 26.37–27.70 s before and 18.92–22.20 s after. The four directed witnesses kept their original order.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compiled query or envelope; the tree is the reused artifact and is answered on its owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned tree, at most n/3 nodes for n above twelve with two three-number arrays each and leaf arrays of entry references; the per-level slices of internal nodes are garbage once their children are built.
