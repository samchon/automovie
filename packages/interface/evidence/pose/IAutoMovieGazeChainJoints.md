# src/pose/IAutoMovieGazeChainJoints.ts#IAutoMovieGazeChainJoints.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains rig fallback, clinical aim units and intentionally retained excess on the head.

## @evidence contracts/development/design.md#principled-representation

Finite flexion/twist degrees are caller premises; a connected head/neck chain shares effective ROM, otherwise the full aim stays on head.

## @evidence contracts/development/design.md#minimal-and-owned-surface

gazeChainJoints reads the rig's ancestry and constraints and leaves impossible residual for the downstream ROM gate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null explicitly means no rig; two-axis addition is documented as an approximation rather than claiming exact quaternion preservation.
