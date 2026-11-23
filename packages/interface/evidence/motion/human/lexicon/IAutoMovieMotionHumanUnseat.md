# src/motion/human/lexicon/IAutoMovieMotionHumanUnseat.ts#IAutoMovieMotionHumanUnseat

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's subject id. frame: The carrier contact the rider sits on. fall: How the rider leaves. side: The side the rider falls, is dragged or slides to. release: Seconds into the act the saddle lets go. cue: A cue track whose first instant inside the act is the release, as a hit. push: The rider's speed away from the saddle the fall adds, metres per second. stirrup: The drag's stirrup contact. free: Seconds after the release a breakaway stirrup lets the dragged foot go. mane: The mane contact a slumped rider's hand holds. stays: Whether a slumped rider stays on. lie: Seconds lying after the landing.

## @evidence contracts/development/design.md#principled-representation

A closed fall vocabulary, a side, instants in seconds, a speed in metres per second and the carrier's own contact ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanUnseat` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The release velocity is the carrier's own, read from its moving contact.

# src/motion/human/lexicon/IAutoMovieMotionHumanUnseat.ts#IAutoMovieMotionHumanUnseat.Fall

## @evidence contracts/development/common.md#meaningful-documentation

States each way of leaving the saddle, its direction and how it lands or stays on.

## @evidence contracts/development/design.md#principled-representation

A closed union of the seven ways a rider leaves a moving saddle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The act's `fall` member reads it and `HumanUnseat` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per way; the drag's stirrup and the slump's mane and stays are optional members of the act the other ways leave unused, and their presence per way remains for the law.
