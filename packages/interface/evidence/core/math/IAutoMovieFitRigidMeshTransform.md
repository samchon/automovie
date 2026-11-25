# src/core/math/IAutoMovieFitRigidMeshTransform.ts#IAutoMovieFitRigidMeshTransform.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Describes correspondence, shared units, selected-coordinate admission, borrowed buffers and degenerate fitting.

## @evidence contracts/development/design.md#principled-representation

Flat buffers use the same length unit and compatible frames; vertex ordinals address triples. Runtime checks equal triple-aligned lengths and distinct resident selected vertices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Facial rigid-component and carried-body fitting reuse existing arrays and selections without another mesh representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only selected coordinates are checked for finiteness; invalid selections or nonrepresentable centering throw. No scale, reflection, joint-feasibility or nonpenetration certificate is supplied.

# src/core/math/IAutoMovieFitRigidMeshTransform.ts#IAutoMovieFitRigidMeshTransform.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Gives application order, ownership and centroid units.

## @evidence contracts/development/design.md#principled-representation

A unit quaternion and two input-unit centroids express only a proper rigid fit between the input frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumers apply centered rotations directly, without an affine matrix or cancellation-prone translation vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate correspondences can have multiple optima; the returned deterministic rotation carries no physical motion or nonpenetration verdict.
