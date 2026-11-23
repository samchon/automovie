# src/model/IAutoMovieMeshMorphTarget.ts#IAutoMovieMeshMorphTarget

## @evidence contracts/development/design.md#principled-representation

Relative deltas aligned with the mesh's vertex order are glTF's morph target representation, which the viewer uploads as Three's relative morph attributes; admission checks length, finiteness and name uniqueness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A name, two delta buffers and an optional driver: the name is the address expressions use, the buffers are the shape, and the driver is the one optional source of a pose-dependent weight.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing normal deltas leave normals unchanged rather than being estimated, and a mismatched buffer is refused instead of padded or truncated.

## @evidence contracts/development/common.md#meaningful-documentation

States the deformation formula, the order relative to skinning, the units and alignment of each buffer, how a weight is supplied and what null normals mean.
