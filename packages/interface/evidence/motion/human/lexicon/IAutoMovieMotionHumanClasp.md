# src/motion/human/lexicon/IAutoMovieMotionHumanClasp.ts#IAutoMovieMotionHumanClasp

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier the body rides. frame: Its contact the body is carried by. duration: How long the hold lasts. left, right: What each hand holds.

## @evidence contracts/development/design.md#principled-representation

Subject, contact and bone ids and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanClasp` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The held points are the partner's displayed bones and the other carrier's own contacts.

# src/motion/human/lexicon/IAutoMovieMotionHumanClasp.ts#IAutoMovieMotionHumanClasp.IHold

## @evidence contracts/development/common.md#meaningful-documentation

subject: The partner's or the prop's subject id. bone: The partner's bone. contact: The prop's contact.

## @evidence contracts/development/design.md#principled-representation

A subject and either a bone or a contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanClasp`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
