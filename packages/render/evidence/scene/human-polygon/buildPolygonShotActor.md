# src/index.ts#buildPolygonShotActor

## @evidence contracts/development/common.md#meaningful-documentation

States the host's mounting, sampling and disposal responsibilities, along with the source time and frame conventions.

## @evidence contracts/development/implementation.md#principled-implementation

All passes read the same polygon node transform at the exact shot-local frame boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the existing drawing with its shot cues, then convert each layer's source frame through the production clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a layer from another shot and uses the timeline's source frame directly.

## @evidence contracts/development/implementation.md#efficient-algorithms

The polygon drawing and cue plan are built once. Each layer converts one frame and applies one sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the regular polygon drawing and the same rational clock as other production render passes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned drawing owns the render resources. The sampler retains that drawing and the shot's fixed source clock.
