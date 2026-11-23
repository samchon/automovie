# src/motion/human/lexicon/IAutoMovieMotionHumanSabre.ts#IAutoMovieMotionHumanSabre

## @evidence contracts/development/common.md#meaningful-documentation

on: The horse's subject id. frame: Its seat contact. prop: The sabre's subject id. carry: The carriage the act begins in. cue: The charge cue's track. gaits: The ride's gait changes as a cue track. target: What the engage points at. transition: Seconds the slope takes to reach the engage. duration: How long the act lasts.

## @evidence contracts/development/design.md#principled-representation

Subject and contact ids, a closed carriage literal, a cue track and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanSabre` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cue is the author's; the reaction is the rider's own warned latency.

# src/motion/human/lexicon/IAutoMovieMotionHumanSabre.ts#IAutoMovieMotionHumanSabre.Carry

## @evidence contracts/development/common.md#meaningful-documentation

Names the two carriages and where the blade is in each.

## @evidence contracts/development/design.md#principled-representation

A closed union of the march carriage and the charge carriage of the 1908 thrusting pattern.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The act's `carry` member reads it as the carriage it begins in, and `HumanSabre` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per carriage, with no optional fields to combine.
