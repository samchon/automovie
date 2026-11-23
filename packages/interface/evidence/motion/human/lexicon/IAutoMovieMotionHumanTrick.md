# src/motion/human/lexicon/IAutoMovieMotionHumanTrick.ts#IAutoMovieMotionHumanTrick

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's subject id. frame: The saddle's seat contact. figures: The figures in order.

## @evidence contracts/development/design.md#principled-representation

A closed figure vocabulary, sides, seconds and a prop id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanTrick` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every hold is the trick saddle's own moving contact.

# src/motion/human/lexicon/IAutoMovieMotionHumanTrick.ts#IAutoMovieMotionHumanTrick.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States each figure's body placement and which straps, sides and hands it uses.

## @evidence contracts/development/design.md#principled-representation

A closed union of the trick-saddle figures, each held on the saddle's own contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IFigure.kind` reads it and `HumanTrick` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per figure; a figure's side and pickup object are members of `IFigure` the other figures leave unused.

# src/motion/human/lexicon/IAutoMovieMotionHumanTrick.ts#IAutoMovieMotionHumanTrick.IFigure

## @evidence contracts/development/common.md#meaningful-documentation

kind: The figure. side: The side it is made on. transfer: Seconds it takes to reach. hold: Seconds it is held. object: The prop a pickup takes from the ground.

## @evidence contracts/development/design.md#principled-representation

A closed kind, a side, seconds and a prop id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanTrick`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
