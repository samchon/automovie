# src/motion/human/handling/IAutoMovieMotionHumanDrawFromCarrier.ts#IAutoMovieMotionHumanDrawFromCarrier

## @evidence contracts/development/common.md#meaningful-documentation

Names the object, the hand, the carrier's two frames, the straight line and the stillness premise.

## @evidence contracts/development/design.md#principled-representation

The carrier's affordance ids define the line and the guide in the carrier's own frame, so they follow a worn carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The registered `drawFromCarrier` law reads it; `HumanSheath.draw` writes it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Affordance ids instead of a blade or carrier kind or a written length.

# src/motion/human/handling/IAutoMovieMotionHumanDrawFromCarrier.ts#IAutoMovieMotionHumanDrawFromCarrier.IFrom

## @evidence contracts/development/common.md#meaningful-documentation

Names each affordance's role.

## @evidence contracts/development/design.md#principled-representation

Scene subject and affordance ids, checked by the law against the carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five ids the law reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.

# src/motion/human/handling/IAutoMovieMotionHumanDrawFromCarrier.ts#IAutoMovieMotionHumanDrawFromCarrier.IPull

## @evidence contracts/development/common.md#meaningful-documentation

States when a long draw needs the other hand, how the carrier moves with it, the trunk turn's unit and default, and where the carrier is worn after.

## @evidence contracts/development/design.md#principled-representation

The carrier's throat affordance by id and the trunk's turn away from the drawing side in degrees; the carrier's slide and turn follow from the arm's reach rather than being supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by the draw law for a blade longer than the drawing arm's reach.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the carrier moves by the least that brings the hand within reach, not by an authored amount.
