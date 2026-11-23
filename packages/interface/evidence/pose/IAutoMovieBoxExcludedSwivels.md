# src/pose/IAutoMovieBoxExcludedSwivels.ts#IAutoMovieBoxExcludedSwivels.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Explains the fixed-axis rotation premise, clinical frame and conservative refusal behavior.

## @evidence contracts/development/design.md#principled-representation

The rotation callback takes swivel degrees and returns bone-local quaternions; canonical axes, rest frame and ROM describe the decomposition domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

boxExcludedSwivels supplies certified exclusion arcs to hingedArmArticulation while the caller retains rig-specific scoring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null constraint or missing swing-twist frame certifies no exclusion; arbitrary callback rotations outside the fixed-axis premise cannot be safely pruned.
