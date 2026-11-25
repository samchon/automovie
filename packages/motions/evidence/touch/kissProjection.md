# src/touch/kissProjection.ts#kissProjection

## @evidence contracts/development/common.md#meaningful-documentation

Defines the inputs, frames, output and the two rotation axes.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's yaw-pitch-roll product gives the sideways sine equation followed by the independent forward sine equation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Unrotate the two inputs, then solve the two planar projections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unachievable projection returns null. The caller verifies the displayed body and its actual ranges.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
