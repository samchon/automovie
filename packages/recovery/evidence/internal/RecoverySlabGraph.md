# src/internal/RecoverySlabGraph.ts#RecoverySlabGraph.observe

## @evidence contracts/development/implementation.md#principled-implementation

Union-find joins active triangle preimages across edges and vertices in the open scalar slab of the indexed complex. Boundary loops map through supplied supporting source faces; nonmanifold edge multiplicity, degenerate incidence and components without boundary observations remain unsupported. This observes connectivity, not geometric embedding or exact predicates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper owns active triangle components and boundary assignment; source cutting, fitting and engine tessellation retain their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A loop with missing or multi-component support is marked unsupported, and source-open or unrepresented contours invalidate only their connected preimage component.

## @evidence contracts/development/common.md#meaningful-documentation

Defines physical scalar bounds, canonical incidence, support ownership and local output index meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V scalar positions, T triangles and Q boundary records plus their face addresses, validation and indexed incidence cost expected O(V+(T+Q) alpha(T)) time and O(T+Q) storage per slab. Every active triangle is scanned because an unobserved internal component must remain a reported omission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Active triangle roots are reused for both boundary cuts and defect supports within one slab; no mutable source cache survives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Union-find, edge owners and support-root maps expire on return; only curve indices and reason strings escape.

# src/internal/RecoverySlabGraph.ts#RecoverySlabGraph.prepare

## @evidence contracts/development/implementation.md#principled-implementation

One-time finite scalar and source-address admission precedes the same clipped-source union-find used by observe. Candidate-local slots preserve original face order and incidence; all active components remain represented even when absent from saved boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The closure owns source admission while query-local compact arrays and a face-to-slot map own slab connectivity. Source IDs remain private; outputs separate boundary indices, optional probe ordinals and omission reasons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller must supply every face meeting strict open-slab overlap; query validation checks ordering and addresses without replacing that completeness premise. There is no geometric proximity match, source repair or whole-mesh cache.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable input lifetime, strict candidate inclusion, original face support IDs, independent probe ordinals, complete default traversal and hidden-component retention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission costs O(V+T) time and constant extra storage. A query with A candidates and Q boundary records plus face addresses costs expected O((A+Q) alpha(A)) time and O(A+Q) storage. Compact arrays and final component discovery use A entries; no V or T scan occurs with candidates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Finite scalar and address checks are reused by queries on the same immutable source. Each query reuses its roots for both boundary cuts and defects, then releases all query maps.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The extraction owns the closure and source references until finished. Compact union-find and support maps expire per query, and only curve index arrays and reason strings escape.
