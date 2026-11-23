# src/motion/human/dressing/IAutoMovieMotionHumanBindPartner.ts#IAutoMovieMotionHumanBindPartner

## @evidence contracts/development/common.md#meaningful-documentation

States what is carried where, what the link binds and when it frees.

## @evidence contracts/development/design.md#principled-representation

The dressing of a partner plus the link the wear carries, so custody and binding are one record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dressing's members, the visit's pause for its hold, and one link.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A link naming both or neither end, or a bad slack, is refused at runtime by the law.

# src/motion/human/dressing/IAutoMovieMotionHumanBindPartner.ts#IAutoMovieMotionHumanBindPartner.ILink

## @evidence contracts/development/common.md#meaningful-documentation

States the two alternative second ends, the slack's unit and what it bounds.

## @evidence contracts/development/design.md#principled-representation

The second end is a partner's region or a scene target; the slack is metres of free length between the two ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One second end and one length, read by the bind-partner law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two ends are optional fields rather than a union, so naming both or neither end and a bad slack remain for the law's runtime refusal.
