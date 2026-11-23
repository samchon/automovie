# src/physics/IAutoMoviePhysicalHullMass.ts#IAutoMoviePhysicalHullMass.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Uniform-solid convex-hull mass properties before assigning material density or mass.

## @evidence contracts/development/design.md#principled-representation

volume is cubic metres; centerOfMass is in the input points' frame; inertia is principal moment per unit mass in square metres, sorted ascending.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalHullMass allocates the result from hull tetrahedra and centroidal principal axes; consumers multiply inertia by their chosen mass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects a hull spanning no volume. The quaternion maps principal coordinates to the shape frame; these values do not include placement in the world.
