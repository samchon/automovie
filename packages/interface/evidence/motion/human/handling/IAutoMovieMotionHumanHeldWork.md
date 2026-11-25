# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the held prop, the hand, the drives, the place, the take and the duration.

## @evidence contracts/development/design.md#principled-representation

Seconds, metres in the floor frame and articulation units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs the law reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A work that neither drives, moves nor takes is refused.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.IDrive

## @evidence contracts/development/common.md#meaningful-documentation

Names the articulation and its target travel with its unit.

## @evidence contracts/development/design.md#principled-representation

Degrees for a turning articulation, metres otherwise, as the engine's articulation map has them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a drive reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The travel must lie in the articulation's declared range.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.IDigit

## @evidence contracts/development/common.md#meaningful-documentation

Names the digit and the contact it stays on.

## @evidence contracts/development/design.md#principled-representation

A digit name and an affordance id riding the driven articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a drive's digit goal reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact must ride the driven articulation.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.Digit

## @evidence contracts/development/common.md#meaningful-documentation

Names the five digits of one hand.

## @evidence contracts/development/design.md#principled-representation

A closed union of the five digits, so an unknown digit cannot be named.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IDigit.digit` reads it to choose the digit a drive keeps on its contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per digit, with no optional fields to combine.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.IMount

## @evidence contracts/development/common.md#meaningful-documentation

Names the prop and the socket.

## @evidence contracts/development/design.md#principled-representation

Subject and affordance ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a take or a leave reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The socket must exist on its prop.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

Names the three offsets and their frame.

## @evidence contracts/development/design.md#principled-representation

Metres along the heading's right, up and forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `workHeld` places the held prop's origin at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A place beyond the arm is refused.

# src/motion/human/handling/IAutoMovieMotionHumanHeldWork.ts#IAutoMovieMotionHumanHeldWork.ISteady

## @evidence contracts/development/common.md#meaningful-documentation

Names the steadying tool, its working point and where on the surface it stays.

## @evidence contracts/development/design.md#principled-representation

A subject, an affordance id and a planar point on the stroke's surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `write` reads for its steadying hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tool must be held by the other hand.
