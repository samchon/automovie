# src/internal/readMotionAccessor.ts#readMotionAccessor

## @evidence contracts/development/implementation.md#principled-implementation

Shape and FLOAT storage are checked before stride-aware component reads; every copied numeric value must be finite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Motion-specific shape admission stays here while shared reader code owns buffer view, stride and little-endian decoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sparse or normalized integer motion data is not coerced into the profile's exact FLOAT interpretation.

## @evidence contracts/development/common.md#meaningful-documentation

Comments state source admission premises, permitted shapes, finite-value refusal and flat element/component order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Count times shape width drives time and output space; one reader and DataView serve the entire accessor copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The inspector caches this complete decoded accessor by index and expected shape within one immutable input revision.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The output array belongs to its caller; the reader's borrowed payload reference ends when decoding completes.
