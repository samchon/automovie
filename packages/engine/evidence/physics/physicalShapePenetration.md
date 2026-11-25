# src/physics/physicalShapePenetration.ts#physicalShapePenetration

## @evidence contracts/development/implementation.md#principled-implementation

The penetration depth of two convex sets is the distance from the origin to the boundary of their Minkowski difference; EPA converges to it from inside for polytopes exactly and for round shapes within the stated tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

GJK's simplex cases, then EPA's expansion; supports are `physicalShapeSupport`'s.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is relative to the shapes' scale at float64 and the iteration caps only stop a curved shape's endless refinement; a capped result is the best face found, still inside the true depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 64 GJK and 128 EPA iterations, each one support query and a face scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Builds its polytope per call and returns fresh vectors; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the algorithms, their sources, the outputs and the null case.
