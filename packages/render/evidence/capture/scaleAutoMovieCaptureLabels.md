# src/capture/scaleAutoMovieCaptureLabels.ts#scaleAutoMovieCaptureLabels

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the rule and its floor, and both users.

## @evidence contracts/development/implementation.md#principled-implementation

An area reduction by a factor `k` maps `k` still pixels onto one sheet pixel, so a font pixel of `ceil(k)` still pixels covers at least one sheet pixel; the shorter sides bound the reduction because the cell keeps the still's aspect.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression, shared by the run and the draw call planner so both use one scale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed size: the scale follows the still and the reader's cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure expression.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number.
