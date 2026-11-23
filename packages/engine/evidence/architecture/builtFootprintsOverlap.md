# src/architecture/builtFootprintsOverlap.ts#builtFootprintsOverlap

## @evidence contracts/development/implementation.md#principled-implementation

For ordered finite boxes, positive plan area requires the greater minimum to lie strictly below the lesser maximum on both axes. This also refuses a zero-width or zero-depth footprint inside another box; a `NaN` extent compares false.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate shared by the single-relation support status and the whole-building support sweep owns the positive-area interval test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No slack and no special case: exact edge contact is excluded by the strict comparisons that define positive-area overlap.

## @evidence contracts/development/common.md#meaningful-documentation

States the two axes compared and why height is ignored, that edge or corner contact answers false, and the metre unit of the boxes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four extrema and two strict comparisons take constant time, with no input-sized algorithm or data structure.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate on two values that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Compares eight stored numbers of two caller-owned boxes and keeps neither box after returning.
