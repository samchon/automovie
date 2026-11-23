# src/lexicon/holdPrecisionSwing.ts#holdPrecisionSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends held, the condition and how the edge is found.

## @evidence contracts/development/implementation.md#principled-implementation

The clearance is monotone along each side of the contact, so the edge is its one sign change, found by bisection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One edge search used for both ends, then one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A contact that is not clear holds nothing, so the stroke's own reach check refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two bisections of fixed rounds, once per stroke.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the stroke's own path and clearance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The held path retains the path and the two edges.
