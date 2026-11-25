# src/physics/IAutoMovieProjectPhysicalSupportReach.ts#IAutoMovieProjectPhysicalSupportReach.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Reach balls and a common-root travel budget for bounded geometric seed projection.

## @evidence contracts/development/design.md#principled-representation

Origins, fixed targets, radii and translation limits are world metres; iterations is an integer in [1,64] and tolerance is nonnegative metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectPhysicalSupportReach borrows support geometry and allocates a translation without changing goals or a simulated body.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks finite inputs, positive radii and valid work limits. Empty supports yield zero translation/excess and convergence; incompatible balls may leave a nonzero residual.

# src/physics/IAutoMovieProjectPhysicalSupportReach.ts#IAutoMovieProjectPhysicalSupportReach.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Common-root seed translation and the remaining worst support-reach violation.

## @evidence contracts/development/design.md#principled-representation

translation is a world displacement in metres bounded by maximumTranslation; maximumExcess is the nonnegative worst original reach-ball excess.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectPhysicalSupportReach allocates the result without moving the supplied origins or targets; consumers decide whether to use the seed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

converged means maximumExcess <= the declared tolerance, not successful native movement or a proof of globally optimal translation.
