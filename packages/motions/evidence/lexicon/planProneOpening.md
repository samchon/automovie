# src/lexicon/planProneOpening.ts#planProneOpening

## @evidence contracts/development/common.md#meaningful-documentation

States the incoming support, stroke sequence, contact behavior and outgoing support.

## @evidence contracts/development/implementation.md#principled-implementation

Alternates two resolved palm goals placed on the floor, while the displayed prone entry supplies the resting torso, limb and yaw geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build each hand placement and its windows once, then read the active stroke on the action clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Palms use the body surface offset on the physical support; the stroke constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in strokes at plan time; one stroke lookup and at most one arm goal per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The entry's resolved bones, hand shapes and palm offsets are read once and shared by every sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only its stroke placements for the plan's lifetime.
