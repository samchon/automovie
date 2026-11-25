# src/sport/layGymnasticsWheelFoot.ts#layGymnasticsWheelFoot

## @evidence contracts/development/common.md#meaningful-documentation

States the ball, the turn, the rocker, the edge and the floor.

## @evidence contracts/development/implementation.md#principled-implementation

A planted foot keeps its ball and turns about it; past the ankle's range it rolls onto its forefoot's border; the lowest collider of the foot and toes is kept at the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pivot, relax, one collider reading, one raise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot clear of the floor is not moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolve and one collider reduction per call; the plants call it once per key.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot's pivot, the relaxed placement, the leg goal and the collider minima.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the ball, the heading and one collider reader.
