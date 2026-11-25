# src/architecture/createMovingWalkway.ts#createMovingWalkway

## @evidence contracts/development/implementation.md#principled-implementation

One level band of the drawn length and pallet width between two landings, handrails at the drawn height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, then the plates, band and rails, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Length, pallet width and handrail height are KONE's read ranges. The rail offset, plate thickness, landing depth and mass are provisional construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Five parts and five contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning the model.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the drawn structure and the separate moving band.
