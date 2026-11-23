# src/motion/classifyLocomoteGroundDisplacement.ts#classifyLocomoteGroundDisplacement

## @evidence contracts/development/implementation.md#principled-implementation

Compares the full XYZ norm and XZ norm against LOCOMOTE_GROUND_EPSILON; a displacement is vertical-only only after it exceeds the full-distance no-op band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One classification supplies both distances and mutually exclusive no-op/vertical-only decisions to the locomotion owner, keeping its threshold interpretation together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the shared metre-scale epsilon for both decisions rather than caller identity or fixture coordinates; finite vector admission remains the invoking locomotion gate's premise.

## @evidence contracts/development/common.md#meaningful-documentation

States metre coordinates, finite-input premise, strict threshold and mutually exclusive classification meanings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed-dimensional hypot evaluations and comparisons require constant time and one scalar result object.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Both classification flags reuse the computed full norm; no mutable displacement result is cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only two distances and two booleans escape; the input vector and no external resource are retained.
