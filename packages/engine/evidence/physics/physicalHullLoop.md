# src/physics/physicalHullLoop.ts#physicalHullLoop

## @evidence contracts/development/common.md#meaningful-documentation

States the projection axes, the walk, the winding, the loop's start and what happens to collinear members.

## @evidence contracts/development/implementation.md#principled-implementation

Andrew's monotone chain (1979) on the members' coordinates in an orthonormal basis of the face plane; with `v = normal x u` the basis is right-handed about the normal, so the chain's counter clockwise order is counter clockwise seen from outside.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one loop owner of `physicalHullFaces`: a searched, a reflected and a translated hull all order their faces through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance of its own: membership is the caller's, and a turn of exactly zero or less drops the middle point in both chains alike.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the points for the members and an O(M log M) sort of the M members.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One face's loop per call; the hull that holds it is remembered by `physicalHullFaces`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; its projected records die with the call.
