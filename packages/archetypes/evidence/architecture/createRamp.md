# src/architecture/createRamp.ts#createRamp

## @evidence contracts/development/implementation.md#principled-implementation

The run is the rise divided by the slope; the incline is a thin slab whose upper face lies in the slope, from where its lower edge meets the floor to the landing's edge, over a block under its upper half, and the landing a box at the rise; no part reaches below the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, derive the run, three parts and three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No handrail here: a ramp that needs one takes a `createBar` rail beside it. The incline is not a solid wedge, which no primitive is: the slab leaves out the toe lower than its own thickness and stands open under its lower half, while the `slope` surface covers the whole incline from the floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the ramp's direction, origin and the two contacts.
