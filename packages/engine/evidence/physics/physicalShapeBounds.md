# src/physics/physicalShapeBounds.ts#physicalShapeBounds

## @evidence contracts/development/implementation.md#principled-implementation

The raw facade composes the complete parent/shape frame before observing shape kind, then uses exact sphere/capsule/box axis extents or rotated hull vertex extrema in the existing arithmetic order. Sphere orientation does not change an extent, but reading that raw orientation remains observable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The raw pose facade preserves centre-then-rotation-then-kind observation. FromFrame owns full bounds/optional hull transfer, both full sphere entries share sphereBounds, and explicit scalar entries compose only needed components before sharing one non-spherical Y kernel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every shape formula, component extremum, unknown-kind failure and lack of numeric admission here. Raw parent/local rotation getters and their failures remain observed after centre construction even for a sphere; bounds are not replaced with support-candidate minima or a new tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sphere/capsule/box cost O(1), hulls O(V). The full raw facade reuses its owned rotated offset and still composes orientation for every kind; full hulls keep scalar extrema and sphere bounds omit an extent vector. Explicit scalar entries use rotateVectorY without unused coordinates/maxima; lowestFromParent additionally needs no parent transform wrapper. Collector outputs alone retain O(V) points; all share fixed unit axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full entries share fromFrame and scalar entries share lowestFromShapeFrame. Current composed-frame readers may additionally adopt each fresh rotated hull point only after its extrema are consumed, avoiding a second rotation. Parent-Y floor input is current geometry, never an earlier bound or pose answer; ordinary calls freshly read inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no pose, shape, frame or result globally; min/max are fresh and independent of adopted hull points, whose ownership transfers only after every bounds component has consumed them.

## @evidence contracts/development/common.md#meaningful-documentation

States supported geometry, admitted transforms, world metres and fresh full bounds. Lowest returns the same world minimum Y, and lowestFromParent accepts actual parent Y/rotation before local-shape composition; full/collected-hull conventions remain unchanged.
