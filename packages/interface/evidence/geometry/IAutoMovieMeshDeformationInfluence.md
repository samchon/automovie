# src/geometry/IAutoMovieMeshDeformationInfluence.ts#IAutoMovieMeshDeformationInfluence

## @evidence contracts/development/design.md#principled-representation

Value plus gradient is the first-order description the chain rule needs for the masked map's Jacobian, which the deformer then uses for normals and per-triangle orientation checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record per vertex with exactly the two quantities the Jacobian formula reads, so masking happens inside the checked deformation rather than as a later multiply on its output.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The deformer refuses a wrong sample count, a non-finite value or a weight outside [0, 1] instead of clamping it, and never fabricates a zero gradient for a weight-only mask.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-vertex order, the weight's range and zero meaning, the gradient's unit and frame, how both enter the Jacobian, and which properties admission does not check.
