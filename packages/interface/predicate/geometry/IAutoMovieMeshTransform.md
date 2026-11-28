# src/geometry/IAutoMovieMeshTransform.ts#IAutoMovieMeshTransform

## @evidence contracts/development/common.md#meaningful-documentation

Optional rigid mesh placement components applied as per-axis scale, unit quaternion rotation and metre translation. Use finite fields and scales whose output is representable.

## @evidence contracts/development/design.md#principled-representation

The transform places positions in that order, applies the inverse transpose to normals, and flips triangle orientation when an odd number of scale axes are negative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Placement fields describe the spatial transform. The caller retains the mesh, and the transform preserves copied atlas coordinates through placement.

# src/geometry/IAutoMovieMeshTransform.ts#IAutoMovieMeshTransform.translation

## @evidence contracts/development/common.md#meaningful-documentation

Finite metre offsets added after scale and rotation. Omission gives a zero offset.

# src/geometry/IAutoMovieMeshTransform.ts#IAutoMovieMeshTransform.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Finite unit quaternion applied after scale. Omission gives identity, and the norm may differ from one by at most 1e-6.

# src/geometry/IAutoMovieMeshTransform.ts#IAutoMovieMeshTransform.scale

## @evidence contracts/development/common.md#meaningful-documentation

Finite nonzero factors applied first, with unit scale as the default. An odd number of negative factors reverses triangle winding.
