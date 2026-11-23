# src/carrier/HumanSupportStep.ts#HumanSupportStep

## @evidence contracts/development/common.md#meaningful-documentation

States the planning frame, the support of each footprint, the edge fit, the touchdown carry, the swing and pelvis blends and the aim.

## @evidence contracts/development/implementation.md#principled-implementation

A planted foot keeps its material point on the support that bears it from touchdown; which support bears it is read from the supports' declared surfaces where it lands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan the walk, aim it at the arrival point's landing place, assign each footprint its support, then carry each sample's goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No support speed is assumed: each support's own displayed frame carries its feet. The bearing tolerance is a named provisional value; a surface's edges are its declared extent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two walk plans; each sample reads at most four support frames per carried point, scans the few plants and reads the two hips once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the walk's footprints, timing and leg goals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the walk plan and the plants for the action.
