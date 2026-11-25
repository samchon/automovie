# src/motion/human/compose/IAutoMovieMotionHumanTouchContacts.ts#IAutoMovieMotionHumanTouchContacts.IDeclared

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and how a side is read.

## @evidence contracts/development/design.md#principled-representation

The hand whose arm it is, its segment and the bone, so a row reads the same whichever hand leads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by `sided`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bone is the rig's own name, mirrored with the leading hand rather than restated per side.

# src/motion/human/compose/IAutoMovieMotionHumanTouchContacts.ts#IAutoMovieMotionHumanTouchContacts.IRest

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The arm's segment, the bone it lies along and whose bone it is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all written into the window.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The arm's own side is the touch's, so only its segment is named.
