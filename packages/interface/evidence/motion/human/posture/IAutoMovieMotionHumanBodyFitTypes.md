# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

Each member gives its coordinate frame, units and absence convention.

## @evidence contracts/development/design.md#principled-representation

A rigid bone-local effector is constrained in a world or bone-carried goal frame; a physical radius bounds its Euclidean error separately from numerical equality precision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same fields read by the rows and merit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bone names use the canonical closed vocabulary and rotations use the existing quaternion type.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States every residual's unit and the convergence outcome.

## @evidence contracts/development/design.md#principled-representation

Residuals are measured after the fitted variables are written, not taken from a linear subproblem.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Posture, feasibility, the loop's end status (sco's `OptStatus`, `IAutoMovieMotionHumanSequentialConvex.Status`) and each requested constraint family's residuals; each target's residual is the named `IResidual`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unmet constraints remain visible even when the numerical loop stops.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the input posture, variables, all supported goals and bearing and balance conventions.

## @evidence contracts/development/design.md#principled-representation

Contacts, angle relationships and a physical centre target are constraints on the same posture variables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only current solver inputs; the sprint set is the consumer requiring angles and a positional centre.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Named goals do not alter the rig's joint ranges or substitute a bone for the mass centre.

# src/motion/human/posture/IAutoMovieMotionHumanBodyFitTypes.ts#IAutoMovieMotionHumanBodyFitTypes.IResidual

## @evidence contracts/development/common.md#meaningful-documentation

point: the target's Euclidean point error over its selected axes, millimetres, without subtracting the allowed radius. turn: its rotation or normal-direction residual norm, degrees, zero when neither is requested.

## @evidence contracts/development/design.md#principled-representation

Both are measured on the fitted posture after its variables are written, in the units laws compare with their declared bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanBodyFit.ts (HumanBodyFit.fit, residuals); posture/HumanBodyFitRows.ts (HumanBodyFitRows.residual).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The allowed radius is not subtracted, so a law reads the actual error against its own bound.