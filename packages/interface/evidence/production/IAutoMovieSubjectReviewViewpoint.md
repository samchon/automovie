# src/production/IAutoMovieSubjectReviewViewpoint.ts#IAutoMovieSubjectReviewViewpoint

## @evidence contracts/development/design.md#principled-representation

A unit direction and positive meter distance define inspection camera placement relative to the subject; coverage admits unique nonblank ids and unit directions within its declared numeric tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates viewpoint intent from exact rendered camera pose and receipt so an ordered inspection plan can own the coverage denominator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The coverage fold validates viewpoint ids, unit directions and positive distances, but does not apply projection, pose or state to a camera; these fields express caller-owned inspection intent rather than proving an implemented capture path.

## @evidence contracts/development/common.md#meaningful-documentation

Defines unique viewpoint id, unit direction, positive distance, projection choice and nullable pose/state identity, with camera application left to the caller.
