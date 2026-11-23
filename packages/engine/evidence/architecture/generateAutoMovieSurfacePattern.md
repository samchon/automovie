# src/architecture/generateAutoMovieSurfacePattern.ts#generateAutoMovieSurfacePattern

## @evidence contracts/development/implementation.md#principled-implementation

Enumerates safe-integer lattice bounds, clips rectangles against canonical convex outlines and measures binary64 shoelace areas. Zone/exclusion overlap beyond tolerance is refused; smaller overlaps can affect accounting. A run-wide set refuses collisions in slash-composed surviving occurrence ids without restricting authored characters. FNV-1a hashing and `seededValue` stabilize variants, without asserting collision-free hashes or cross-platform transcendental bit identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The run owns laying and quantities; clipping, canonical outlines and area live in `clipAutoMoviePatternPolygon`, `canonicalAutoMoviePatternPolygon` and `autoMoviePatternPolygonArea`, and quality judgement in `autoMoviePatternFindings`, and every zone region is canonicalized once and reused for the overlap check and the clip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no zone, module or material. The shared cell cap refuses oversized enumerations, and derived safe-integer bounds ensure incrementing loop indexes advances. Area tolerances define accepted discrepancies rather than proving every floating-point error is bounded.

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed run order and the only source of randomness, when a module is absent, what each placement carries, the units, every thrown refusal, and that quality defects are returned rather than thrown.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canonical hulls cost the sum of n log n over authored outline sizes. Performs Z² zone and E² exclusion clips, whose costs depend on outline vertices, then capped cell enumeration plus arbitrary generator work and one region/E exclusion clips per candidate. Adds id hashing, quantity folds and the full `autoMoviePatternFindings` partner/geometry/sort cost; candidate count and callback time are not bounded by the cell cap.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Lays one declaration per call; the generator is the author's code and may not be pure, so no earlier run's placements are reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Placements/outlines and the run-wide occurrence-id set grow with survivors; each zone's seen-id set grows with all generated candidates including discarded ones. Findings can grow quadratically and callback output has no fixed cap. Local sets/clip arrays are released after use; the caller owns returned records.
