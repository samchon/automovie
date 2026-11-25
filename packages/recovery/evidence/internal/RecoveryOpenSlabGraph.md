# src/internal/RecoveryOpenSlabGraph.ts#RecoveryOpenSlabGraph.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Link-cycle/path admission qualifies strict-interior source vertices; nonmanifold edges matter only when crossing the open slab. Candidate-local boundary segments join only at strict-interior source vertices. Two simple paths each meeting one endpoint per cut must belong to the same admitted one-to-one sheet component.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The existing slab owner supplies component/probe membership; this helper adds source-boundary transport and endpoint permutation only.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every boundary component, invalid source face and hidden sheet survives as probe or defect evidence. No proximity correspondence, invented endpoint, normal copying or aperture closure is used.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable source lifetime, critical-free producer premise, strict-interior joins, source-free output and separate orientation qualification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation uses expected O(V+T) time and storage for source incidence and link traversals. A query uses only A candidate faces, their B boundary edges and Q support addresses, costing expected O((A+B+Q) alpha(A+B)) time and O(A+B+Q) storage; no full-source query scan occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The extraction-scoped closure reuses source admission, boundary incidence, invalid-face observations and prepared sheet connectivity across slabs; changing source requires a new preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Source and O(V+T) incidence live until the extraction discards the closure. Boundary union-find, probes and maps expire per query; only local ordinals and diagnostics escape.
