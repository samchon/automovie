# src/schema/IAutoMovieHumanEyelashSchema.ts#IAutoMovieHumanEyelashSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the upper lash and millimetre unit. Color and anatomical side are supplied through the existing input shape and its parent pair.

## @evidence contracts/development/design.md#principled-representation

The inclusive [0, 15] millimetre range applies to the required length. The Interface owns the inherited eyelash color, and the parent appearance owns left and right membership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The appearance schema reuses the refinement in its eyelash pair. The only added constraint is the lash length bound.
