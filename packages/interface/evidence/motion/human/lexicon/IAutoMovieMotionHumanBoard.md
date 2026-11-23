# src/motion/human/lexicon/IAutoMovieMotionHumanBoard.ts#IAutoMovieMotionHumanBoard

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's subject id. seat: The carrier's seat contact landed on. duration: The flight's time. height: How far the flight rises above the straight way, metres. hand: What a hand holds on the way. load: The carrier's declared capacity and what it carries already.

## @evidence contracts/development/design.md#principled-representation

Subject and contact ids, seconds, metres and a named hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanBoard` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The seat is the carrier's own moving contact.

# src/motion/human/lexicon/IAutoMovieMotionHumanBoard.ts#IAutoMovieMotionHumanBoard.ILoad

## @evidence contracts/development/common.md#meaningful-documentation

capacity: The most the carrier may carry, kilograms. carried: What it carries already, kilograms.

## @evidence contracts/development/design.md#principled-representation

Two masses in kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanBoard`'s capacity refusal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The capacity is the author's declaration for the carrier.

# src/motion/human/lexicon/IAutoMovieMotionHumanBoard.ts#IAutoMovieMotionHumanBoard.IHand

## @evidence contracts/development/common.md#meaningful-documentation

side: The holding hand. contact: The carrier contact held, as the saddle's pommel or horn. partner: The partner's subject id. bone: The partner's bone held, as a forearm.

## @evidence contracts/development/design.md#principled-representation

A side and either a contact id or a partner and bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanBoard`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
