# src/index.ts#createAutoMovieInspectionStrokes

## @evidence contracts/development/common.md#meaningful-documentation

States the object used and why, what the width is measured in and who sets the resolution, the buffer layout and sharing, why the matrix and culling are fixed, and both depth behaviours.

## @evidence contracts/development/implementation.md#principled-implementation

A mark on a surface has the surface's depth, so its ends are led toward the camera along their lines of sight in view space before the shader widens the segment, which keeps their pixels; an orthographic view has one line of sight for every point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Geometry, material, then the object flags; the depth lead is one inserted pair of shader lines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The width is three.js's own screen-space line, not a widened mesh of our own, the lead is the inspection's one stated constant, and mismatched buffers are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One instanced draw call for every segment of the object, whatever the number of colours.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every mark builder draws its lines through this one factory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The geometry and material are created here and owned by the caller, who disposes both; nothing else is retained.
