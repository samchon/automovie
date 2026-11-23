# src/weapons/ArmourLimb.ts#ArmourLimb

## @evidence contracts/development/common.md#meaningful-documentation

States model metres/+Y course, original unfitted extrema, fitted radial cavity, gauntlet cuff fitting site and authored rigid hand-domain limits.

## @evidence contracts/development/implementation.md#principled-implementation

Fitted radial convex wall cells have an inner plane tangent to the admitted limb radius and an outer plane one exact sourced plate gauge beyond it. Unfitted ellipses retain their outer course and share inner factor 1-wall/minimum face support, so adjacent inner corners meet and every face retains at least the authored gauge. Y endpoints retain measured segment length. Gauntlet cuffs continue into mitten/thumb regions with declared coarse hand limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare one bounded radial lattice, emit the tube/cuff, then build the gauntlet's hand and thumb through the shared interval-panel owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No filled cylinder, hidden body solid, extra hand measure, reconstructed elbow reinforce or articulated finger supplies the geometry; insufficient positive wall/working resolution refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen coarse radial cells and, for a gauntlet, ten panels. A fitted circle prepares one radial cell; an unfitted ellipse prepares its eight distinct half-turn classes, without a thin-wall resolution loop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prepared cell and exact Y rotations serve circular sectors, while ellipses share only exact half turns. Core reuses its hull, mesh and local mass without re-admitting each placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh corners and cell records without retaining input, completed geometry, source buffers or external handles.
