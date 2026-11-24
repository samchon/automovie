# src/environments/terrain/createTerrain.ts#createTerrain

## @evidence contracts/development/implementation.md#principled-implementation

Place the parcel by world translation, bake only nonlinear or locally graded heights, and validate the exact footprints with the stage validator. Noise relief is the engine's fractal gradient noise at local plan coordinates over the wavelength, seeded as rolling relief is, scaled by the amplitude about the mean so it stays within it; its first bake pitch is one eighth of the finest octave's wavelength, the rolling rule, and the grading code reads it as any other base sampler. World pieces reuse the stage's hole decomposition and accepted height rule. The stage draws the same color-enabled patch whose support the ground solver reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grade preparation, lattice baking, surface publication and vegetation realization have distinct responsibilities. Tree disks and woods are separate producers that share the accepted rule and the grades' protected-area query; their instance sets and models are concatenated, disks first, so a recipe without woods returns the disks' output unchanged. Both path and amenity anchors read the completed ground rather than author a second elevation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reject nonfinite or collapsed bounds, terrain rotations, invalid rings, inaccessible features, out-of-range noise parameters by name and unsatisfied route heights or slopes. A noise relief passes the bake its finest wavelength and the two fields that lower the lattice, so a budget refusal says what to change. Heightfield sampling and triangle error policies remain in the bake owner.

## @evidence contracts/development/common.md#meaningful-documentation

Gives origin, world placement limits, grade ordering, void and inlay behavior and the meaning of returned anchors and populations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Level and plane terrain stay analytic when no adjustment is needed. Otherwise the lattice and grade constraints dominate build cost. World footprint decomposition runs only for patches with holes; each path or amenity reuses the accepted ground.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A placed build shares one accepted base rule across all of its land regions, world decomposition records and vegetation layouts. Independent placements re-resolve their coordinates and source constraints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared output retains its canonical samples, outlines and compact planting definitions. It acquires no capture, process or renderer resource.
