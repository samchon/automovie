# src/geometry/displaceAutoMovieSurface.ts#displaceAutoMovieSurface

## @evidence contracts/development/implementation.md#principled-implementation

Normal displacement of the limit surface with a discrete perturbed normal, Blinn (1978): the exact limit normal plus the change the displacement makes to the area-weighted vertex normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Takes plain heights, so the field, its chart and its sampling stay with the caller; two passes over the quads give the normals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A displacement that turns the quads around a normal over is refused instead of flipped back, and the undisplaced normals keep their exact limit values.

## @evidence contracts/development/common.md#meaningful-documentation

States the direction at creases and boundaries, the normal rule and its source, the resolution limit and where the heights come from.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V + F) for V vertices and F quads: one pass for the directions, one for the area vectors before and after.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single pass; the heights, the reusable part across poses, are the caller's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result's new arrays are O(V) and owned by the caller.
