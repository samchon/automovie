# src/lexicon/resolveCarriedHoldGeometry.ts#resolveCarriedHoldGeometry

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the order and the null.

## @evidence contracts/development/implementation.md#principled-implementation

The hold is read off the same key relation the borne body rides by, in the same anchor frame, so the bearer reaches where the borne body lies without reading it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key resolution and one frame change per holding hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bearer never reads the borne body's displayed bones, which read the bearer's, so the two cannot chase each other.

## @evidence contracts/development/implementation.md#efficient-algorithms

One key read resolves the collider profile's bone demand and the occupied hold regions' bones with their ancestors. Both grips share the collider placement and there is no key read when both hands are free.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual contact point already belongs to the coupling when it supplies `at`. Each grip shares the key heading and the inverse of a further bearer's anchor.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.
