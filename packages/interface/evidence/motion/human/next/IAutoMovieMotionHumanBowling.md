# src/motion/human/next/IAutoMovieMotionHumanBowling.ts#IAutoMovieMotionHumanBowling

## @evidence contracts/development/common.md#meaningful-documentation

States the behaviour's two methods, what each returns and where the delivery's data is.

## @evidence contracts/development/design.md#principled-representation

One method per law or reader of bowling, each taking its own named parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bowling slide and the pinfall reader, and nothing the throw or the precision deck own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader takes the deck's own records; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanBowling.ts#IAutoMovieMotionHumanBowling.IReadPinfall

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the reader takes from the deck.

## @evidence contracts/development/design.md#principled-representation

The placed pins and the baked deck, both the precision deck's own records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the pinfall credit reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pins and the result are the deck's records, not copies.

# src/motion/human/next/IAutoMovieMotionHumanBowling.ts#IAutoMovieMotionHumanBowling.IPinfall

## @evidence contracts/development/common.md#meaningful-documentation

States what the ids name and their order.

## @evidence contracts/development/design.md#principled-representation

An array of the pins' own ids, the identity every other record of a pin uses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result of `readPinfall` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The array carries ids only; no score or frame is inferred.
