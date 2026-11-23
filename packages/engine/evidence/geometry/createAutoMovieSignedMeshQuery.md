# src/geometry/createAutoMovieSignedMeshQuery.ts#createAutoMovieSignedMeshQuery

## @evidence contracts/development/implementation.md#principled-implementation

The angle-weighted pseudonormal theorem of Baerentzen and Aanaes gives the correct sign at the nearest face, edge or vertex of a closed oriented 2-manifold, so the admission checks exactly its premises (finite nondegenerate triangles, paired oppositely wound edges, single-fan vertex links), and a nearest-first box hierarchy with box distances as lower bounds finds the true nearest feature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compilation admits and precomputes per-triangle projection terms, edge and vertex pseudonormals and the hierarchy; nearest-first visit uses the internal point-box bound owner and allocation-free consider. The warm triangle is measured at the current point once, then omitted from that call's leaf work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy label, radial origin or spatial tolerance decides a side; welding uses exact coordinates only, and the warm start from the previous winner changes which features are pruned, never the answer or its tie-break.

## @evidence contracts/development/common.md#meaningful-documentation

States the method and citation, the sign convention, units, the snapshot and weld, every admission refusal and the caller's remaining obligations, the open-sheet contract and its `boundary` flag, the performance design and why it cannot change answers, and the query's refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compilation is linear in triangles plus the hierarchy build and one link walk per vertex. A query visits nodes nearest-first, skips boxes farther than best and stops a leaf-bound sum on strict excess; its current-point warm seed is not measured twice. A walking caller often visits a few leaves; worst-case work remains O(n).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The welded snapshot, per-triangle terms, pseudonormals and hierarchy are compiled once and reused by every query; the only per-query carry-over is the previous winning triangle, used as a warm start and never as an answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the triangles with their precomputed terms and segments, the vertex pseudonormals, the rim vertex set and the hierarchy, all sized by the mesh at compile time, plus one reference to the last winner; the weld map, the position copy, the vertex identities and the vertex links are released after compilation because no callback captures them, and each query allocates one working record and its returned hit.
