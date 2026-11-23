# src/environments/index.ts#createCoasterCar

## @evidence contracts/development/implementation.md#principled-implementation

Uses the box surface dimensions for both the seat and the side threshold, with a seat frame on the cushion's front edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Emits one body, a platform-height floor, a cushion, back and front cowling. Every primitive is described in car-local coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Dimensions describe the scenic proxy and are not manufacturer specifications. There is no mass, restraint motion, mechanical clearance or operational claim.

## @evidence contracts/development/common.md#meaningful-documentation

Gives stage axes, contact placement, input and output and the limit of the proxy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructs a fixed number of primitive parts and two affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call constructs an independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned model survives the call.
