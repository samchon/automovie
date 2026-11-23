# src/architecture/clipAutoMoviePatternPolygon.ts#clipAutoMoviePatternPolygon

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the established Sutherland-Hodgman algorithm after a record conversion; the generic signed orientation handles the canonical counter-clockwise pattern input with the same half-plane tests.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pattern owns its u/v metre vocabulary while the shared planar operation owns geometry, so pattern and actual footprint consumers use one algorithm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No outline or expected corner is special-cased; strict on-edge crossings are the clipping rule rather than a tolerance compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States frame, units, winding, record ownership, zero-area contact and the remaining floating-point premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear record conversions surround conservative O(M(N+M)) clipping time for N subject vertices and M edges, with O(N+M) live storage including converted outlines.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure adapter coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Converted tuples and intermediate outlines are call-local; returned pattern records belong to the caller and no cache survives.
