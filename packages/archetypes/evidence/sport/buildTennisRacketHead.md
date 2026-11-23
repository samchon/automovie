# src/sport/buildTennisRacketHead.ts#buildTennisRacketHead

## @evidence contracts/development/common.md#meaningful-documentation

States both optical parts, their frame, dimensions and the pattern.

## @evidence contracts/development/implementation.md#principled-implementation

The lower sides of the oval taper to a neck, around a separate throat aperture. Paired front and back strings end on the analytic inner ellipse, with front ends seated inside the frame and the centre strand on the strike plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the frame outline and its two openings, fill the string bed with two directions of strands, and extrude the frame once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The frame has real cavities and the bed consists of solid strands. Physical head and throat proxies and contact frames belong to createRacket.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed 32 oval stations and 35 string strips yield two bounded meshes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same oval samples drive the rim and top of the throat aperture, and the inner semiaxes locate the ends of the strings. Ring extrusion and strip indexing use existing owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent rim and string buffers without retaining input or external resources.
