# src/architecture/builtSpaceObservationStations.ts#builtSpaceObservationStations

## @evidence contracts/development/implementation.md#principled-implementation

Checks the box centre and candidate cell-corner means through `builtSpaceContainsPoint`, checks raised/inset eyes through the same predicate and refuses a non-finite or negligible aim length. These are numerical containment checks under that predicate's premises, not exact-real geometric proofs. Shelled spaces have no cell fallback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Station roles are two fixed tables and one opening pass over shared settle and aim helpers; containment, volume bounds, face centroid and the space lookup are the shared architecture helpers rather than copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space, opening or room type; the eye height, probe length and inset ladder are named observation constants applied to every space alike.

## @evidence contracts/development/common.md#meaningful-documentation

States the closed population and role purposes, numerical containment checks, anchor/fallback, direction/start point, station order, null-pose cases and unknown-space refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays space lookup and full `builtSpaceVolumeBounds` derivation, including convex-cell plane-triple enumeration where applicable. A failed box-centre probe can re-enumerate cells for candidate means. Adds boundary/opening scans, selected-opening sorting, profile hull/centroid work and containment costs for anchor candidates and each fixed ladder rung; those delegated geometry costs vary with volume/outline size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one space per call from the caller's mutable record; within the call the anchor and boundary index serve every station.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the boundary index only for the call; the caller owns the returned station list, bounded by eight plus the space's opening count.
