# src/touch/headRestAim.ts#headRestAim.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The kiss's own body model plus a side bend; a coordinate search over the forward lean and neck grid, the side lean line and the side bend line; a damped least-squares step on a finite-difference Jacobian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One model, one search, one step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges are the kiss's lean ranges and the side bend's.

## @evidence contracts/development/implementation.md#efficient-algorithms

The search runs once at plan time; each second costs one region read and one 3 by 3 solve, the Jacobian four region reads once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the kiss's pose model and the trunk's region reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The aim closes over the prepared readers.
