# src/internal/mesh-observations/cutExact.ts#cutExact

## @evidence contracts/development/implementation.md#principled-implementation

Signed linear interpolation and canonical source-edge incidence build the plane intersection multigraph. Only two opposite coplanar incidences whose triangles lie on opposite sides of their edge cancel as a patch interior; edge visitation preserves every remaining contribution. Equal-position canonical aliases must already be qualified by registration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The operator owns source observation only and returns the existing Polyline contract; callers own source registration and generated-surface reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No distance epsilon, positional weld, invented closure, component selection or generated surface is introduced. Canonical identities must already be supplied by registration.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-zero convention, coplanar boundaries, isolated contacts, maximal chains and binary64 predicate limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V positions and T triangles, signed distances, edge incidence and graph walks require expected O(V+T) time and O(V+T) temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Direct calls admit one source chart and reuse each visited vertex's signed difference and each canonical crossing within intersection. Repeated planes can share prepare admission for one immutable source; no global cache exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Graph maps and visited edges expire on return; only ordered physical observations with private source support addresses escape.
