# src/architecture/WasherDrum.ts#WasherDrum

## @evidence contracts/development/common.md#meaningful-documentation

States the aperture, solid shell, assumptions, support and dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

Extrudes disjoint convex sections between the rectangular exterior and the polygonal cavity. The drum depth solves volume divided by polygon area. The support is the bottom chord and the two placement sockets have the same attitude.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the solid back, the drum cross section and the narrower lip, then publish the independent clear opening and loading sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The port, shelf and collision cavity are built from the same geometry. The estimates for the polygon, lip and landing depth are documented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds a bounded number of convex prisms, one between each pair of angular stations, and an end block.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one appliance from its own dimensions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no inputs.
