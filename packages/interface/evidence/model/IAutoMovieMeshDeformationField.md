# src/model/IAutoMovieMeshDeformationField.ts#IAutoMovieMeshDeformationField

## @evidence contracts/development/design.md#principled-representation

An axis-aligned ellipsoid bounds displacement-plus-stretch weighted by `(1 - r^2)^3`. The deformer transports normals through analytic Jacobian cofactors and checks positive vertex determinants and emitted triangle orientation; these local/tessellation checks do not prove the field between vertices or exclude global self-intersection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Centre and radii locate support while displacement and dimensionless stretch describe its local effect; mesh buffers and optional per-vertex influences stay inputs of the compiled deformer rather than fields of this reusable definition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same smooth kernel applies to every feature without named-anatomy exceptions; zero displacement and stretch are neutral, and invalid vectors or nonpositive radii are refused during compilation instead of clamped.

## @evidence contracts/development/common.md#meaningful-documentation

Gives compact support and smooth boundary behavior, mesh-local metre coordinates, strictly positive radii, centre displacement and dimensionless stretch offsets with neutral zero.
