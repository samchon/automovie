# src/vehicles/createTransitBus.ts#createTransitBus

## @evidence contracts/development/implementation.md#principled-implementation

One sourced draw sets the width between opposing seat banks and the aisle affordance. Shared door bay dimensions set the side openings, paired leaves and public contacts. Opposite slider axes and a 1:1 follower keep each opening centered.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the cabin, the two axles and wheel housings, and then the door, seat and handhold affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Door locations, pocket-slide mechanisms, flat passenger floor, seat layout and clearances are scenic approximations. Driver controls, working ramps and wheel spin are outside this model.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds a bounded set of primitive parts and binds each moving leaf once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each scene id gets a separately poseable model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no external resources and holds only the returned model.

## @evidence contracts/development/common.md#meaningful-documentation

States local axes, both paired door controls, boarding supports and handholds, and the seeded or nominal aisle fit.
