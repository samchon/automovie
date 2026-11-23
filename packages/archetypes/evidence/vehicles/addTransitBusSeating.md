# src/vehicles/addTransitBusSeating.ts#addTransitBusSeating

## @evidence contracts/development/common.md#meaningful-documentation

Names the seating geometry and reference frame.

## @evidence contracts/development/implementation.md#principled-implementation

Offsets the mirrored rows by the aisle half-width. The full-width aisle-side pads and backs bound the clearance, and the seat contact shares the cushion dimensions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The row placement and its sitting affordance share this seating assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Curbside gaps remain in the prescribed row layout. The seat contact uses the same dimensions as its geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each prescribed row once and emits a fixed number of solids per row.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing builder and the same seat dimensions for both sides and the affordance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the attached solids and affordance remain in the builder.
