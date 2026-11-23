# src/film/propBoxAxisIsSound.ts#propBoxAxisIsSound

## @evidence contracts/development/implementation.md#principled-implementation `Number.isFinite` on both bounds and a strict `<`, so `NaN`, either infinity, a zero-thickness and an inverted axis all fail, which are exactly the extents no containment or overlap test can use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One per-axis predicate shared by `validatePropPlacements`, which reports each failing axis, and `validatePropPlacementGeometry`, which measures only sound boxes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance widens a flat axis into a volume and no axis is special-cased; a failing box is reported as authored.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, why a failing axis cannot be measured, both callers, and the unit of the box.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two finiteness tests and one comparison, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate on one axis that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads two bounds of the caller's box and allocates or retains nothing.
