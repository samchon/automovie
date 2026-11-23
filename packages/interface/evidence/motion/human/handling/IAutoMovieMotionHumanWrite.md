# src/motion/human/handling/IAutoMovieMotionHumanWrite.ts#IAutoMovieMotionHumanWrite

## @evidence contracts/development/common.md#meaningful-documentation

Identifies both prop roles, the two affordances, the plane and units, the stroke clock and the hand default.

## @evidence contracts/development/design.md#principled-representation

A planar polyline requires two vertices in its type. Coordinates are in the writing affordance's XZ plane in metres, with +Y outward. The write law admits finite distinct consecutive points and a positive duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The registerable write law reads the tool, its working point, the stationary surface frame, one stroke and its timing. Grip placement remains a preceding action's responsibility.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No body, glyph, pen geometry or paper size is embedded. Named affordances come from the scene's two props.
