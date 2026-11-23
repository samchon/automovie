# src/terrain/climbStairsRocker.ts#climbStairsRocker

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed material-footprint premise, moving hip, dorsal limit and transient swing.

## @evidence contracts/development/implementation.md#principled-implementation

The exact rocker evaluates each stance on its forefoot material point. Its pitch orbit does not depend on hip height or load; both actual values still enter the room equation. Swing placements each define their own orbit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bind one exact source per declared footprint, select the source with the current placement, and evaluate its current rocker.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Swing gets the ordinary moving-foot geometry. Each stance and swing reads the same ankle range and reach constraints as the original rocker.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed reader per footprint. Each later stance read keeps its heading, sole pivot, orbit and body terms. The actual rocker and moving-swing work remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Planted placement identity belongs to the stair plan's immutable footprint, while each hip and dorsal-limit pair is evaluated freshly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed geometry releases with the plan. Swing sources and all queried placements release with their current sample.
