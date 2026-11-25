# src/sport/createWaterPoloBall.ts#createWaterPoloBall

## @evidence contracts/development/implementation.md#principled-implementation

Converts the supplied circumference to physical radius and uses the same center and diameter for the collider and grip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw two dimensions, use one sphere and place two physical sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The model uses the size and mass band rather than another sport's ball silhouette.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rigid part and two named affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each draw owns one independently sized ball.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No external state.

## @evidence contracts/development/common.md#meaningful-documentation

States the model anchor, shape, mass and grip frame.
