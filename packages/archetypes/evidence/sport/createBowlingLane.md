# src/sport/createBowlingLane.ts#createBowlingLane

## @evidence contracts/development/implementation.md#principled-implementation

Uses the USBC Equipment Specifications and Certifications Manual, lane approach and pin spots, for width, 15 ft clear approach, 60 ft from foul line to headpin and the equilateral 12 in spot grid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the approach, lane and gutters before recording the named support and pin references.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The deck and approach share a floor height. The trough shape, board textures and pinsetter are omitted and the structural thickness is provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed part and socket count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

New model per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after the builder returns.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the parts and placement frame.
