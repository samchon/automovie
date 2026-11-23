# src/pose/IAutoMovieFitDigitDescent.ts#IAutoMovieFitDigitDescent.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines lexicographic metre residuals, variable projection and the supplied resolution/tolerance policy.

## @evidence contracts/development/design.md#principled-representation

start and project use one fixed coordinate dimension, clinical degrees for fitDigitToTarget; step shares that unit and tolerance returns a metre norm bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitDigitToTarget supplies residual and ROM projection closures to fitDigitDescent, leaving digit geometry and coordinate conventions with the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The solver expects nonempty finite coordinates, positive resolution and stable residual dimensions; these callback shapes do not validate arbitrary numeric functions.
