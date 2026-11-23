# src/geometry/emitAutoMovieSupportLoft64.ts#emitAutoMovieSupportLoft64

## @evidence contracts/development/implementation.md#principled-implementation

Planned cubic intersection curves define both side boundaries of every ruled face. Event triple incidence unites the corresponding endpoint identities; one canonical boundary position is reused exactly, and plane derivatives generate normals independently of any source or triangle field.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This engine emitter owns newly allocated mesh, physical correspondence and sampled generating construction; the planner owns continuous incidence and the caller owns saved coefficients and admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate welding, source mesh/normal, per-row table or missing cap supplies output. Canonical endpoint disagreement beyond the stated binary64 conditioning allowance refuses; exact zero-area triangles remain counted omissions.

## @evidence contracts/development/common.md#meaningful-documentation

States metre coordinates, plane-derived normal limits, physical versus normal-fan identity, collapsed triangles, numerical boundary diagnostics and open ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C strips, P planes, S spans, E events and T triple-incidence visits at their stations, geometry emission costs O(C); canonical union lookups have a conservative O(T P squared) bound and compress visited paths. T is bounded by O((S+E+1) P cubed). Local point/union maps retain O(C + (S+E+1) P squared) records; maxVertices precedes output allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The planner's fixed pair determinant serves every point roundoff bound. One canonical physical position is stored per station/pair-equivalence key and reused across adjoining faces and spans; each incident curve's own evaluation still checks its disagreement with that position. The same evaluated rows supply construction without another fit or mesh scan. Each triangle reads its three integer physical identities once and compares them pairwise instead of allocating an identity array and Set.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mesh, physical source table, construction and diagnostics transfer to the caller; local point/union maps expire after this synchronous operation, without GPU, I/O or retained worker.
