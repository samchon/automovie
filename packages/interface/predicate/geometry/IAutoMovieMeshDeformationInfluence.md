# src/geometry/IAutoMovieMeshDeformationInfluence.ts#IAutoMovieMeshDeformationInfluence

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed differential mask sample at one original mesh vertex.

## @evidence contracts/development/design.md#principled-representation

The deformer composes weighted displacement with the gradient's outer-product term in the deformation Jacobian before testing triangle orientation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sample supplies a value and its derivative. Compiled deformation fields, source topology and between-vertex mask behavior remain with their owners.

# src/geometry/IAutoMovieMeshDeformationInfluence.ts#IAutoMovieMeshDeformationInfluence.weight

## @evidence contracts/development/common.md#meaningful-documentation

Finite dimensionless mask in [0, 1]. A zero weight retains the original position, while the gradient can still affect local normal transport.

# src/geometry/IAutoMovieMeshDeformationInfluence.ts#IAutoMovieMeshDeformationInfluence.gradient

## @evidence contracts/development/common.md#meaningful-documentation

Finite spatial derivative of the mask in inverse metres in the mesh frame. Its outer product with displacement affects the Jacobian.
