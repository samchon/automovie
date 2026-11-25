# src/executable/humanPolygonMan.ts#humanPolygonMan

## @evidence contracts/development/common.md#meaningful-documentation

States the preparation, its cost and that nothing is stored.

## @evidence contracts/development/implementation.md#principled-implementation

Human's skeleton-level canonical preparation, then the engine measurer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare, then measure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every call prepares the body from its parameters with the code as it stands, so no stored body can stand in for the current Human.

## @evidence contracts/development/implementation.md#efficient-algorithms

One closed-form preparation and one measurement per call; the dominant cost is the hull search of the body's colliders inside the preparation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Coordinates no requests; a caller that needs one body twice holds the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing between calls.
