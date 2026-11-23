# src/motion/human/next/IAutoMovieMotionHumanBilliards.ts#IAutoMovieMotionHumanBilliards

## @evidence contracts/development/common.md#meaningful-documentation

States what the behaviour credits and how its result is read.

## @evidence contracts/development/design.md#principled-representation

One reader over the precision deck's own records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pocket credit and nothing the precision deck owns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader takes the deck's own records; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanBilliards.ts#IAutoMovieMotionHumanBilliards.IReadPocketed

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the reader takes from the shot.

## @evidence contracts/development/design.md#principled-representation

The balls, the pocket mouths and the baked shot, all the precision deck's own records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the pocket credit reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The balls, pockets and result are the deck's records, not copies.

# src/motion/human/next/IAutoMovieMotionHumanBilliards.ts#IAutoMovieMotionHumanBilliards.IPocketed

## @evidence contracts/development/common.md#meaningful-documentation

States what the list holds and its order.

## @evidence contracts/development/design.md#principled-representation

An array of the precision deck's own pocketed-ball record, with its ball, pocket and film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result of `readPocketed` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the record is the deck's, not redefined.
