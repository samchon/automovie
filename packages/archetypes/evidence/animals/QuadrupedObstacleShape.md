# src/animals/QuadrupedObstacleShape.ts#QuadrupedObstacleShape

## @evidence contracts/development/common.md#meaningful-documentation

States the bound per solid and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A capsule of the bar's radius and half-length contains a cylinder or cone of the same radius and height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One case per solid.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound only grows a round part, so a clear bound is a clear part.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh shape.
