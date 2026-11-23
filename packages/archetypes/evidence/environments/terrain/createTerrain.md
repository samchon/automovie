# src/environments/terrain/createTerrain.ts#createTerrain

## @evidence contracts/development/implementation.md#principled-implementation

Place the parcel by world translation, bake only nonlinear or locally graded heights, and validate the exact footprints with the stage validator. World pieces reuse the stage's hole decomposition and accepted height rule. The stage draws the same color-enabled patch whose support the ground solver reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grade preparation, lattice baking, surface publication and vegetation realization have distinct responsibilities. Both path and amenity anchors read the completed ground rather than author a second elevation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reject nonfinite or collapsed bounds, terrain rotations, invalid rings, inaccessible features and unsatisfied route heights or slopes. Heightfield sampling and triangle error policies remain in the bake owner.

## @evidence contracts/development/common.md#meaningful-documentation

Gives origin, world placement limits, grade ordering, void and inlay behavior and the meaning of returned anchors and populations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Level and plane terrain stay analytic when no adjustment is needed. Otherwise the lattice and grade constraints dominate build cost. World footprint decomposition runs only for patches with holes; each path or amenity reuses the accepted ground.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A placed build shares one accepted base rule across all of its land regions, world decomposition records and vegetation layouts. Independent placements re-resolve their coordinates and source constraints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared output retains its canonical samples, outlines and compact planting definitions. It acquires no capture, process or renderer resource.
