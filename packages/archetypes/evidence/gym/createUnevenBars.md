# src/gym/createUnevenBars.ts#createUnevenBars

## @evidence contracts/development/implementation.md#principled-implementation

The two round rods are placed so that the centre distance minus their common diameter is the specified diagonal. The grip axes coincide with the rods.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the sizes, resolve the horizontal offset and assemble the two rails and their supports.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rail heights use their top edges and the diagonal uses nearest surfaces. The frame is coarse and fixed for the take.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of rods and boxes and one square root per model.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds an independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction retains no external resources.

## @evidence contracts/development/common.md#meaningful-documentation

Names the bars' alignment, support frame and grip locations.
