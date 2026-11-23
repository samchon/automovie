# src/music/PianoPedalConstruction.ts#PianoPedalConstruction

## @evidence contracts/development/common.md#meaningful-documentation

States the pedal's purpose, coordinate and reference.

## @evidence contracts/development/implementation.md#principled-implementation

A case-mounted hinge moves the neck, plate and foot contact together. The full angle gives the estimated vertical drop at the plate centre by its measured radius from the hinge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the neck and plate, attach both to the hinge, and mount the contact on the plate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sourced location and visible arrangement inform documented construction estimates. Articulation uses the shared rigid hinge.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two parts and one affordance require constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the builder's primitives and the shared pedal articulation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.
