# src/pose/IAutoMovieTwoBoneChainArticulation.ts#IAutoMovieTwoBoneChainArticulation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains resolved world rest geometry, target shell behavior and the explicit bend-normal fallback.

## @evidence contracts/development/design.md#principled-representation

Lengths and positions use metres, frame rotations are unit, and the world bend normal is normalized. The solver returns null for links or target distance below 1e-6 metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

twoBoneChainArticulation derives bone-local root and mid articulations; callers own clinical decomposition and range admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The geometric solver exposes no named action or bone pair and does not claim a free-swing mid joint satisfies hinge ROM.
