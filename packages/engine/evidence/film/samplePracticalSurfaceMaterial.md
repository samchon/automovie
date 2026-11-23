# src/film/samplePracticalSurfaceMaterial.ts#samplePracticalSurfaceMaterial

## @evidence contracts/development/common.md#meaningful-documentation

Gives the target scope, time interval, exact key behavior, input premise and absence result.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the node-part pair and finds the greatest admitted key time at or before the sample by upper-bound search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function only selects a target and searches its ordered keys. Admitting inputs and applying appearance are separate operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads only fixed material ids and the requested time. Seeks do not depend on earlier samples or mutate a prop or its model.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear search across the tracks and one logarithmic search within the selected track, using constant auxiliary space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The admitted keys are searched in place, with no derived work to retain across frame requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows shot data for one call and returns only a scalar or undefined.
