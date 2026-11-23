# src/motion/human/next/IAutoMovieMotionHumanPolo.ts#IAutoMovieMotionHumanPolo

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Polo family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Polo laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanPolo.ts#IAutoMovieMotionHumanPolo.IPolo

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's subject id. frame: The carrier contact the rider sits on. mallet: The held mallet's subject id. ball: The ball's subject id. side: The horse's side the stroke is made on. stroke: Forehand or backhand. contact: Seconds into the act the head meets the ball. lean: The trunk's lean out over the side, degrees. speed: The ball's speed off the mallet, metres per second.

## @evidence contracts/development/design.md#principled-representation

Closed side and stroke literals, seconds, degrees and a speed, and subject ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanPolo` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ball's place is the ball prop's own at the contact.

# src/motion/human/next/IAutoMovieMotionHumanPolo.ts#IAutoMovieMotionHumanPolo.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the horse's two sides in polo terms and which side each is.

## @evidence contracts/development/design.md#principled-representation

A closed union of the horse's sides, named as polo names them rather than as the rider's left and right.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stroke's `side` member reads it and `HumanPolo` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per side, with no optional fields to combine.

# src/motion/human/next/IAutoMovieMotionHumanPolo.ts#IAutoMovieMotionHumanPolo.Stroke

## @evidence contracts/development/common.md#meaningful-documentation

Names the two strokes and the swing direction of each.

## @evidence contracts/development/design.md#principled-representation

A closed union of the forehand and backhand swings through the ball.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stroke's `stroke` member reads it and `HumanPolo` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per stroke, with no optional fields to combine.
