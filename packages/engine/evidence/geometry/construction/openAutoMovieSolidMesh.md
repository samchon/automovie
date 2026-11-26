# src/geometry/construction/openAutoMovieSolidMesh.ts#openAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Cancels opposite triangle-edge occurrences, reads split-edge provenance and walks the remaining directed domain boundary with accumulated integer phase lifts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Explicit cycle charts and winding carry occurrence data to cap/event consumers; no global-ID-to-first-chart lookup or geometry registry is used.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A trim edge is never an endpoint merely because it is unpaired. Branching or partial periodic endpoint arcs are reported instead of closed by a guessed cap; unmatched internal edges refuse the plan.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes domain/trim provenance, native positive traversal, period winding, genuine endpoint classification and partial-result reporting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hashes O(T+S) triangle/constraint edges and uses angular halfedge incidence in O(B log B) worst-case work for B exposed edges; no nearest-cycle matching or world-space search is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the planner's actual subdivision/provenance and corner lifts without splitting constraints or reading surface jets again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

O(T+S+P) edge/provenance references are local; returned cycles own O(B) copied indices/chart numbers and no mesh, surface or callback.
