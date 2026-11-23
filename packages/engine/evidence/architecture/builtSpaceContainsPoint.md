# src/architecture/builtSpaceContainsPoint.ts#builtSpaceContainsPoint

## @evidence contracts/development/implementation.md#principled-implementation

Uses half-space intersection/union for cells and the Van Oosterom-Strackee solid-angle sum for shells, with a surface-first triangle test. Closed consistently oriented shells and finite, well-conditioned intermediates are premises; validation checks local opposite edge pairing and positive aggregate volume but does not certify every component's orientation, all self-intersections or arbitrary binary64 containment. Shell plane and edge tests reuse one numeric slack at different geometric scales.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One public reader of both volume spellings with two private helpers for the shell, so every containment consumer shares one answer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space; surface-first handling admits boundary points without selecting a ray direction. Its fixed numeric slack and raw solid-angle arithmetic are stated approximations, not an exact numerical certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States both spellings and the empty case, that the boundary counts as inside, the slack and its unit caveat for unnormalized normals, and how voids read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the summed plane count of the cells, stopping at the first containing cell, or in the shell's triangle count, stopping at the first triangle the point lies on; no acceleration structure is built because each call answers one point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure test of one point against one space value that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only temporary vectors and retains nothing.
