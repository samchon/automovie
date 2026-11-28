# src/skeleton/AutoMovieHumanCanonicalSolids.ts#AutoMovieHumanCanonicalSolids.build

## @evidence contracts/development/common.md#meaningful-documentation

The input map is parent first, keyed by Human joint id, and measured in canonical metres. The result follows stock module and split-run order and supplies a carrier, centre, centroid-relative points, volume and unit-mass inertia for each convex piece.

## @evidence contracts/development/implementation.md#principled-implementation

Feed the reflected rest joints, tips and heel-plane points to the same ring resolver as the drawing. Reflect the emitted points back, test ring vertices and edge midpoints against the hull tolerance, and split failed runs at a common ring. The physical profile handles hand phalanges as grasp capsules.

## @evidence contracts/development/implementation.md#efficient-algorithms

Process one module's layer stack at a time. Keep each accepted point array so the engine's per-array hull memo can serve mass calculation and the centred transfer. The caller receives solids and their mass properties.
