# src/geometry/construction/faceAutoMovieSolidMesh.ts#faceAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Retains untouched full cells, triangulates the remaining native constrained region with original shared IDs, validates exposed domain boundaries and emits one declared orientation for the complete face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grid/source preparation, index planning, open-boundary reading and final writes have explicit owners; one commit point follows all fallible geometry preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not omit a missing-grid source, weld boundary vertices, zip unrelated cycles or use foreign owner coordinates as this face's chart. Named failure without a callback throws rather than silently returning an empty skin.

## @evidence contracts/development/common.md#meaningful-documentation

States named versus thrown failure, buffer/owner atomicity, partial endpoint diagnostics, chart orientation and the ordinary-array/coherent-source premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prior global triangles cost one numeric comparison each per face and keys only for the triangles appended or taken back since the last face of the same mesh (`incidence`), so F faces over T triangles cost O(F T) comparisons and O(T) keys instead of O(F T) keys. Then grid O(G(S+L)), constraint/bridge/ear/insertion/legalization work, every membership query's cost and O(T log T) ordering of T staged triples. Occupied pairs exclude new interior bridges/ears; full cells or inserted cavities conflicting with prior incidence are refused without an alternative search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses copied station-major jets, original boundary indices and returned split provenance; each committed new vertex is inserted once on its first actual use. The edge incidence of earlier faces is read once per triangle and kept for the mesh's later faces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local state includes grid G, triangles T, split edges S and provenance P. One incidence ledger per mesh, O(E_existing) pair and directed-edge counts and a copy of the index buffer, is held in a WeakMap keyed by the mesh and is released with it; it is brought to the buffer's actual contents on every call, so a truncated or refilled buffer is never read stale. Otherwise only actual mesh owners, vertex/index numbers and caller-owned open records survive.
