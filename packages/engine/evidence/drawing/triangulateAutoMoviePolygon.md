# src/drawing/triangulateAutoMoviePolygon.ts#triangulateAutoMoviePolygon

## @evidence contracts/development/implementation.md#principled-implementation

Ear clipping, which triangulates any simple polygon because one always has two ears (Meisters' two-ears theorem); the premise of a simple ring is enforced by `autoMoviePlanarRegionFailure` before clipping, the ring is oriented counter-clockwise by its shoelace sign so a positive turn means convex, and covered counts include corners on a triangle's boundary, so a touching corner blocks an ear rather than producing a sliver that crosses it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the triangulation of a cap outline; the turn, coverage and containment rules are private helpers because nothing else scores ears.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No polygon is special-cased, and a ring with no clean ear is clipped at its best corner by the same score instead of through a fallback branch.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the scoring order and tie rule, why progress is guaranteed, both refusals and their messages, that either winding is accepted and walked counter-clockwise, and the shape and winding of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

For `n` corners, the initial coverage counts cost `O(n^2)`, and each of the `n - 3` passes costs `O(n)`: one scan for the best score, one containment test of the clipped corner against every other triangle to decrement the counts it leaves, and a full recount for only the two neighbours whose triangles change, so the whole clip is `O(n^2)` with linear extra space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per face-only boundary per drawing; the scores it maintains are reused across its own passes and nothing outlives the call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The ring, turn and coverage arrays are allocated per call and released when it returns; only the returned triples survive.
