# src/scene/inspection/countAutoMovieCameraOcclusionPixels.ts#countAutoMovieCameraOcclusionPixels

## @evidence contracts/development/implementation.md#principled-implementation

For one or four binary samples, the rounded mean is positive exactly when any sample is white. The composite may only mark pixels present in the isolated read, and a nonbinary or incomplete read gives no count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each native sample is read once, with one retained bit per output pixel.

## @evidence contracts/development/common.md#meaningful-documentation

Defines pixel membership, sample dimensions, matching orientation and refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission of the dimensions, then one pass over delivered pixels, each reducing its native samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonbinary, translucent or wrongly sized read, or a composite pixel absent from the isolated read, returns no count instead of a rounded or clamped one.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each mask read is counted once; its occupancy is returned for the composite grade.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the framebuffer bytes for the call and returns a fresh occupancy of one bit per delivered pixel.
