# src/lexicon/placeRideReinPalm.ts#placeRideReinPalm

## @evidence contracts/development/common.md#meaningful-documentation

States the palm and material frames, orientation and metric geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Offsets the line's centre by its actual radius and aligns the measured palm frame at the resulting surface point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Offset the target, align the two axes, then place the wrist.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The actual palm frame and line radius decide placement without estimating palm thickness or length.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One constant-time alignment and placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller shares the immutable palm frame across the ride; both alignment and wrist placement use their canonical owners.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or result.
