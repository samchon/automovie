# src/architecture/builtSpaceContainsPoint.ts#builtSpaceContainsPoint

## @evidence contracts/development/implementation.md#principled-implementation

Uses half-space intersection/union for cells and, for shells, the generalized winding number of `createAutoMovieMeshWindingQuery`, whose surface-first triangle test admits boundary points. Closed consistently oriented shells and finite, well-conditioned intermediates are premises; validation checks local opposite edge pairing and positive aggregate volume but does not certify every component's orientation, all self-intersections or arbitrary binary64 containment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One public reader of both volume spellings. The shell helper only drops the triples the unvalidated shell cannot supply and hands the rest to the shared winding query, so every containment consumer and every form check share one solid-angle sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space; surface-first handling admits boundary points without selecting a ray direction. Dropping triples with a missing or non-finite vertex keeps an unvalidated shell's old false answers instead of throwing; the numeric slack and raw solid-angle arithmetic are the query's stated approximations, not an exact certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States both spellings and the empty case, that the boundary counts as inside, the cell slack and its unit caveat for unnormalized normals, how shells are read through the winding query, which triples are dropped and how voids read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the summed plane count of the cells, stopping at the first containing cell, or in the shell's triangle count: one pass to copy the kept triples, one to admit them and one to sum, the same order as the single sum it replaced; no acceleration structure is built because each call answers one point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure test of one point against one space value that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a temporary position copy and one query per call and retains nothing.
