# src/actions/walkHorizontalRoot.ts#walkHorizontalRoot

## @evidence contracts/development/common.md#meaningful-documentation

States the immutable inputs, action seconds and world horizontal output.

## @evidence contracts/development/implementation.md#principled-implementation

A vertical leg-reach correction preserves the horizontal position. This applies the same stance heading and hip-centred inclination as playback.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the planned root, yaw and scalar inclination, then applies the existing pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual two scheduled feet for heading, the same clamped time and the original pivot arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Does no hip FK, swing or leg IK for a horizontal-only demand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the step, heading and pivot calculations of full posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the same immutable body, gait and step plan as full posture.
