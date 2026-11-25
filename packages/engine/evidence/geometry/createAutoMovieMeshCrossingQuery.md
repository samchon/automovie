# src/geometry/createAutoMovieMeshCrossingQuery.ts#createAutoMovieMeshCrossingQuery

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the existing strict Moller-Trumbore edge tests and dominant-plane overlap tests over unchanged exact triangle boxes. A resident median hierarchy prunes only disjoint boxes. A pure per-triangle self census chooses the least transverse witness, or the least coplanar witness when no transverse witness exists, using the original shared-cell and ordinal order. Traversal order and geometric answer order are distinct. [CGAL AABB Tree](https://doc.cgal.org/6.2/AABB_tree/index.html).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared geometry owner admits initial or refitted targets and current subjects. One traversal serves ordered reports, boolean queries and fixed-index snapshots. A one-shot self census supplies the prepared target triangles as subjects. Only its pure per-triangle form reads candidates directly in hierarchy order and ranks actual witnesses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every source triangle and ordinal survives unchanged. Both directions of the coplanar test retain their original first-triangle plane. Cross-mesh, all-pairs, boolean and classifier calls visit candidates in the original order. Classification tolerances and numerical cutoffs are unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States copied fixed indices and snapshot/refit ownership, cardinality invalidation, metres/common frame, ordering, strict touching/classification, empty/malformed admission, numerical limits and absent containment/continuous-motion guarantees.

## @evidence contracts/development/implementation.md#efficient-algorithms

For v resident coordinate scalars and s triangles, initial preparation costs O(v+s) indexing plus O(s log² s) hierarchy construction; withPositions costs O(v+s) indexing/refit/cell computation without sorting. Ordered calls sort k overlapping candidates per triangle in O(k log k). The pure per-triangle self census examines k candidates linearly and compares only witnesses. For a crossing-dense subject it may perform more narrow-phase tests than an ordered early exit. Worst-case narrow phase remains quadratic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Immutable copied target corners, ordinals, exact boxes, hierarchy and world mean-extent cell serve every call for that snapshot. Explicit fixed-index refits reuse copied indices and partition only; they replace all current geometry/bounds/cell, including every zero-area ordinal, without retaining a parent query or point-dependent verdict. The one-shot self census uses the same ordered snapshot as its subject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each caller-owned query retains O(s) current triangle/tree state, a shared frozen O(s) index run and the source scalar cardinality until dropped. Refits produce independent geometry without pose history; census scratch/reports are fresh and no first mesh, callback or returned report is retained. In the one-shot self census, a single snapshot and scratch live for the synchronous call.
