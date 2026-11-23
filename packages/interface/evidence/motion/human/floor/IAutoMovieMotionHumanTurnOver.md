# src/motion/human/floor/IAutoMovieMotionHumanTurnOver.ts#IAutoMovieMotionHumanTurnOver

## @evidence contracts/development/common.md#meaningful-documentation

States the turn and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The lying position reached, the side a half turn passes and the support it lies on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The position, the side, the support, the hold and the manner the bedroom and sleep scenes use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An entry not lying is refused at runtime.

# src/motion/human/floor/IAutoMovieMotionHumanTurnOver.ts#IAutoMovieMotionHumanTurnOver.Position

## @evidence contracts/development/common.md#meaningful-documentation

Names the four lying positions about the body's long axis.

## @evidence contracts/development/design.md#principled-representation

A closed union of the back, either side and the front, the quarter turns about the long axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action's `to` member reads it as the position reached.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per position, with no optional fields to combine.

# src/motion/human/floor/IAutoMovieMotionHumanTurnOver.ts#IAutoMovieMotionHumanTurnOver.IOn

## @evidence contracts/development/common.md#meaningful-documentation

States the prop and its surface affordance, with the default.

## @evidence contracts/development/design.md#principled-representation

A prop by scene id and one of its `surface` affordances by id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, the `on` of turnOver and lieTogether, read by turnOver and `AutoMovieMotionHumanSleep.sleep` to place the lying body.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing prop or surface remains for runtime refusal.
