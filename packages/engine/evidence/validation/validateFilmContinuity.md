# src/validation/validateFilmContinuity.ts#validateFilmContinuity

## @evidence contracts/development/implementation.md#principled-implementation

Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The film coordinator uses the same tolerance and boundary policies as pairwise continuity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero/singleton films return after tolerance admission without resolving unused snapshots; explicit invalid tolerances remain errors.

## @evidence contracts/development/common.md#meaningful-documentation

Ordered beats,50mm/5deg defaults and advisory missing/mount/drift outputs are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B>=2, beat resolution plus actor indexing/comparison per cut dominates and all B snapshots remain live during the call; no-cut input performs only tolerance admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Middle beat rows supply their opening to the incoming cut and their end to the outgoing cut; first-opening and last-end states are still resolved but unused. No snapshot is cached across mutable film inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Resolution inputs are borrowed; snapshots/maps release after validation while diagnostics transfer to the caller.
