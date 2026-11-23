# src/motion/human/floor/IAutoMovieMotionHumanLieOnSurface.ts#IAutoMovieMotionHumanLieOnSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the route each way and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The support is a prop's named lying surface and edge seat; the position is one of the lying ones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support, the edge, the position, the direction, the hold and the manner the bedroom scenes use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A surface too short or narrow for the body, or an entry not seated on the edge, is refused at runtime with the dimension.

# src/motion/human/floor/IAutoMovieMotionHumanLieOnSurface.ts#IAutoMovieMotionHumanLieOnSurface.Position

## @evidence contracts/development/common.md#meaningful-documentation

Names the two lying positions and which side the lateral one lies on.

## @evidence contracts/development/design.md#principled-representation

A closed union of the lying positions the route from the edge reaches, so an unreachable position such as prone cannot be named.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action's `position` member reads it to choose the end of the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per position, with no optional fields to combine.
