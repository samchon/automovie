# src/motion/human/compose/IAutoMovieMotionMeeting.ts#IAutoMovieMotionMeeting

## @evidence contracts/development/common.md#meaningful-documentation

A resolved meeting between named performer roles, with its shared frame, contacts, synchronized instants and optional coupling. Actions and performance evaluation consume the same meeting.

## @evidence contracts/development/design.md#principled-representation

The contacts are stored in the shared frame, so they read the same for both roles and survive a move of the pair; the instants are film seconds, the one time both actions share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionMeeting.of resolves a shared meeting read by action contexts and participant laws; contact points, film instants and coupling are published once for all participants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contact points remain in the meeting frame and instants remain film seconds. AutoMovieMotionMeeting owns role ordering, alignment and negotiation refusal.

# src/motion/human/compose/IAutoMovieMotionMeeting.ts#IAutoMovieMotionMeeting.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States what each bound does and what is free outside them.

## @evidence contracts/development/design.md#principled-representation

A held meeting (a hug, a clasp) lasts as long as the story says, which only the composition knows; its two ends are film seconds every role reads alike.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two optional numbers, read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A window cannot shorten a meeting below its natural contact: `of` refuses it instead of cutting the reach.

# src/motion/human/compose/IAutoMovieMotionMeeting.ts#IAutoMovieMotionMeeting.IOfContext

## @evidence contracts/development/common.md#meaningful-documentation

start: Action start in performance seconds, used to place the meeting on the shared timeline.

## @evidence contracts/development/design.md#principled-representation

start: Action start in performance seconds, used to place the meeting on the shared timeline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionMeeting.ts (AutoMovieMotionMeeting.of, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionMeeting.of.
