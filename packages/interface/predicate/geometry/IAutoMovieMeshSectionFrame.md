# src/geometry/IAutoMovieMeshSectionFrame.ts#IAutoMovieMeshSectionFrame

## @evidence contracts/development/common.md#meaningful-documentation

Origin and three orthonormal directions expressed in the mesh frame. The section calculation assumes these directions are unit and orthogonal.

## @evidence contracts/development/design.md#principled-representation

Outline forms signed heights through projection on the selected axis and chooses the next two axes in cyclic order as its chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record supplies only a calibration frame. Each section call supplies its own axis ordinal and stations.

# src/geometry/IAutoMovieMeshSectionFrame.ts#IAutoMovieMeshSectionFrame.origin

## @evidence contracts/development/common.md#meaningful-documentation

Section reference point in the input millimetre frame. The centre of each cut adds its station displacement along the selected direction.

# src/geometry/IAutoMovieMeshSectionFrame.ts#IAutoMovieMeshSectionFrame.axes

## @evidence contracts/development/common.md#meaningful-documentation

Ordered orthonormal unit directions. An axis ordinal selects its normal and the next two cyclic positions select chart axes.
