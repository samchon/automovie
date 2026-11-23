# src/environments/rides/createTrackedRails.ts#createTrackedRails

## @evidence contracts/development/implementation.md#principled-implementation

Places the same four profile corners on every station frame and connects corresponding edges. Ends have opposed outward caps for open rails; closed rails share seam indices without coincident copies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses one sampled frame array for both profiles, then emits each mesh and its one material.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This is coarse scenic rail geometry. The fixed rectangular section is not an engineering rail section and the sampled strips do not certify track clearances, strength or walkability.

## @evidence contracts/development/common.md#meaningful-documentation

States the local coordinate and gauge rules, strip topology and the intended visual level of detail.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of emitted stations after course evaluation, with four vertices and two triangles per side edge on each station span.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Samples stations once and uses the same frame array for the two rails.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the output vertex/index buffers outlive construction; no cache or process is retained.
