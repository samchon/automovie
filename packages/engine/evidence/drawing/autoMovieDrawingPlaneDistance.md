# src/drawing/autoMovieDrawingPlaneDistance.ts#autoMovieDrawingPlaneDistance

## @evidence contracts/development/implementation.md#principled-implementation

The point-plane distance as the dot product of the offset with the plane's unit normal, exact up to rounding because `autoMovieDrawingFrame` returns a normalized normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One definition of the side test shared by cut extraction, clipping and depth classification, so every pass agrees on which side a corner is.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point or view is special-cased, and the tolerance is applied by the callers that classify, not folded into the distance.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the plane's definition, the sign convention and what each sign means for a cut, and the unit.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One subtraction and one dot product, so there is no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time pure function; caching a distance would cost more than computing it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one temporary vector and retains nothing.
