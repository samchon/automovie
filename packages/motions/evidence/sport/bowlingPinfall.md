# src/sport/bowlingPinfall.ts#bowlingPinfall

## @evidence contracts/development/common.md#meaningful-documentation

States the USBC rule, the tip-over criterion, its derivation, the read instant and the conservative bias.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid pin resting on its base is stable only while its centre of mass projects inside the footprint; beyond the tip-over tilt it cannot rest upright, so it is down. The read uses the solved final attitude.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The deck solve stays generic in bakePrecisionDeck; this reader owns the bowling credit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle comes from each pin's own geometry and mass properties, with no tuned threshold.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P * V) for P pins of V hull vertices, plus one cache read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads one final frame for every pin.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh id list and retains nothing.
