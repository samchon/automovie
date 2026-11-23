# src/vehicles/createRailCarriage.ts#createRailCarriage

## @evidence contracts/development/implementation.md#principled-implementation

The reference supplies the envelope, floor, door pitch and width, truck arrangement and seating widths. One validated height determines both seat geometry and contact. Paired leaves use opposite slider axes with a positive 1:1 coupling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the shell and doors, end walls and trucks, seats and grab rails, then the fixed boarding contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Body and interior details are staged estimates, including sheet thickness, cushion depth and pole stations. The seat-height band uses the RVAA Committee's transfer-seat recommendation for scenic staging. The gap between cars has no bellows.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of primitive sections and two independently transformed leaves per door.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds an independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no model or external resource.

## @evidence contracts/development/common.md#meaningful-documentation

States the model coordinates, paired door controls, fixed matching platform dimensions, seedless seat height and the accepted seat-height override.
