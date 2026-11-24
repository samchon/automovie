# src/geometry/buildAutoMovieMeshQueryHierarchy.ts#buildAutoMovieMeshQueryHierarchy

## @evidence contracts/development/common.md#meaningful-documentation

States the finite world-box inputs, ordering and scratch-array ownership, exact descendant bounds and empty sentinels. The default builder preserves stable centre ties. The partition entry serves the crossing query, which owns its candidate order.

## @evidence contracts/development/implementation.md#principled-implementation

Uses median-rank equal-count splitting. Every node encloses the componentwise union of its entries. The partition entry uses three-way selection around the median, including tied centres, and shares the exact bounds and widest-axis choice. [Physically Based Rendering](https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The builder partitions boxes, while the queries own entry admission, geometry and traversal. The partition path separates bounds, axis choice and selection and walks the two child ranges of one array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every entry and exact bound survives. The leaf threshold only changes the work split. The default entry preserves tie order, while the crossing owner independently sorts candidates by cell and original triangle ordinal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The stable entry sorts each span per level for O(n log² n) time. Partition selection visits at most two spans before a local sort fallback, giving O(n log n) usual work and O(n log² n) when fallback recurs. On the same 571,024-triangle neutral mesh, crossing preparation was 11.24 s in both stable trials and 4.62–5.40 s in three partition trials. Preparation plus traversal was 26.37–27.70 s and 18.92–22.20 s respectively. The four directed witnesses kept their order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller retains the built hierarchy for subsequent queries. Current-position refits reuse the caller-owned partition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stable path owns transient internal slices and its leaf arrays. Its small-input leaf shares the caller's array. The returned tree has two three-number bound arrays per node and at most n/3 nodes above twelve entries. The partition path shares one caller scratch array through recursion and copies only each leaf span, with temporary sort storage for its active range. The hierarchy retains O(n) nodes and leaf entry references.
