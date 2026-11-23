# src/physics/preparePhysicalGeometry.ts#preparePhysicalGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose, the null-impulse authority, the contact and projection methods and the bounds cull.

## @evidence contracts/development/implementation.md#principled-implementation

Two convex solids come nearest on an edge or a round axis of one of them (Ericson, "Real-Time Collision Detection", 2005, ch. 5 and 9); separated bounds on one axis prove a gap of at least that separation, so the cull never drops a contact within the prediction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three small queries over the engine's shape owners; no option or layer beyond the documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or margin is added: the cull compares bounds with the prediction exactly, and every remaining pair is measured exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

A culled pair costs two bounds; a measured pair one proximity query per wire of each shape.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Hull wire frames are shared per point list by `physicalShapePairDistance`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The queries retain nothing; the asynchronous signature is kept for its existing callers and resolves at once.
