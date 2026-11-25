# src/geometry/createAutoMovieMeshCrossingQuery.ts#createAutoMovieMeshCrossingQuery

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the existing strict Moller-Trumbore edge tests and dominant-plane overlap tests over unchanged exact triangle boxes. A resident median hierarchy prunes only disjoint boxes, and the boolean stops only after one narrow-phase witness has proved the existential result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared geometry owner admits initial or refitted targets and current subjects. One traversal serves complete reports, boolean queries and fixed-index snapshots. The one-shot census delegates to the same traversal. A self census can supply the prepared target triangles directly as subjects.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every source triangle and ordinal survives unchanged, no mesh or contact relation is exempted, and classification tolerance/callback behavior and numerical cutoffs remain explicit. No global identity cache or mutable transform cache is used.

## @evidence contracts/development/common.md#meaningful-documentation

States copied fixed indices and snapshot/refit ownership, cardinality invalidation, metres/common frame, ordering, strict touching/classification, empty/malformed admission, numerical limits and absent containment/continuous-motion guarantees.

## @evidence contracts/development/implementation.md#efficient-algorithms

For v resident coordinate scalars and s triangles, initial preparation costs O(v+s) indexing plus O(s log² s) hierarchy construction; withPositions costs O(v+s) indexing/refit/cell computation without sorting. A census indexes f current triangles and sorts k overlapping candidates per triangle in O(k log k); the boolean stops only on an actual witness. Worst-case narrow phase remains quadratic, and a poorly fitting retained partition can increase traversal work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Immutable copied target corners, ordinals, exact boxes, hierarchy and world mean-extent cell serve every call for that snapshot. Explicit fixed-index refits reuse copied indices and partition only; they replace all current geometry/bounds/cell, including every zero-area ordinal, without retaining a parent query or point-dependent verdict. The one-shot self census uses the same ordered snapshot as its subject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each caller-owned query retains O(s) current triangle/tree state, a shared frozen O(s) index run and the source scalar cardinality until dropped. Refits produce independent geometry without pose history; census scratch/reports are fresh and no first mesh, callback or returned report is retained. In the one-shot self census, a single snapshot and scratch live for the synchronous call.
