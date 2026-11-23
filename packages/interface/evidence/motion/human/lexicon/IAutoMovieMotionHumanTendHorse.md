# src/motion/human/lexicon/IAutoMovieMotionHumanTendHorse.ts#IAutoMovieMotionHumanTendHorse

## @evidence contracts/development/common.md#meaningful-documentation

Names the support, the hand, the contact, the task, the film-second duration, the acquire and release intervals and the stroke.

## @evidence contracts/development/design.md#principled-representation

One named contact on one prop for one hand over a finite interval, with the task as a closed union; timing is checked when the action is planned and reach at each sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The handler's stance is the entry's and the horse prop owns the contact's world frame; this record names only what the hand does.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No horse pose, course or response is supplied here; the horse's responses are authored on the horse.

# src/motion/human/lexicon/IAutoMovieMotionHumanTendHorse.ts#IAutoMovieMotionHumanTendHorse.Task

## @evidence contracts/development/common.md#meaningful-documentation

Names each task.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The task decides the contact's kind and whether the hand strokes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/motion/human/lexicon/IAutoMovieMotionHumanTendHorse.ts#IAutoMovieMotionHumanTendHorse.ITool

## @evidence contracts/development/common.md#meaningful-documentation

Names the held prop and its working contact.

## @evidence contracts/development/design.md#principled-representation

Two ids: the prop subject and one of its contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the care action to seat the tool's working face on the horse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tool's pose is read from the performance, never supplied here.
