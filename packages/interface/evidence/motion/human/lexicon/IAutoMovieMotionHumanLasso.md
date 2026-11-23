# src/motion/human/lexicon/IAutoMovieMotionHumanLasso.ts#IAutoMovieMotionHumanLasso

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's subject id. frame: The carrier contact the rider sits on. lariat: The held lariat's subject id. target: What the loop is thrown at. stride: A cue track of the horse's stride the swing keeps time with. swings: How many turns the loop makes before the throw. flight: The loop's flight time. dally: The horn the rope is dallied round and how many turns.

## @evidence contracts/development/design.md#principled-representation

Subject and contact ids, counts and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanLasso` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target is the animal's own moving contact at the catch.

# src/motion/human/lexicon/IAutoMovieMotionHumanLasso.ts#IAutoMovieMotionHumanLasso.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

subject: The animal's subject id. contact: Its contact the loop settles over.

## @evidence contracts/development/design.md#principled-representation

A subject and a contact id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanLasso`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/lexicon/IAutoMovieMotionHumanLasso.ts#IAutoMovieMotionHumanLasso.IDally

## @evidence contracts/development/common.md#meaningful-documentation

horn: The carrier's horn contact. turns: Turns round it.

## @evidence contracts/development/design.md#principled-representation

A contact id and a whole count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanLasso`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
