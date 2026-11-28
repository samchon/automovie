# src/geometry/IAutoMovieMeshTarget.ts#IAutoMovieMeshTarget

## @evidence contracts/development/common.md#meaningful-documentation

Mutable attribute buffers filled by flat-triangle procedural builders and handed off with the returned mesh.

## @evidence contracts/development/design.md#principled-representation

The empty target owns four independent arrays. Each append creates three face-local vertices and adds one explicit index triple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The target extends the existing tessellation buffer contract with required texture coordinates. Skin and other mesh metadata belong to the caller.

# src/geometry/IAutoMovieMeshTarget.ts#IAutoMovieMeshTarget.uvs

## @evidence contracts/development/common.md#meaningful-documentation

Packed metric UV pairs parallel to the target vertices. Each triangle append adds three pairs in the supplied winding order.
