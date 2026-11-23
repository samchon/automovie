# src/motion/human/compose/IAutoMovieMotionMeetingTiming.ts#IAutoMovieMotionMeetingTiming

## @evidence contracts/development/common.md#meaningful-documentation

The ready, decisive stroke and relaxation instants of a meeting, in seconds. The containing field or operation states the origin: role-local timing, resolved film time or converted action-local time.

## @evidence contracts/development/design.md#principled-representation

The instants two performers must agree on are when both are ready, when the contact is made and when it is left; they carry the names of a phrase's standard instants, so each law pins its own clock to them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Meeting kinds produce natural role timing, meeting resolution publishes film timing and timing conversion gives action-local timing; all use the same three synchronization labels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each containing callback or field states its time origin. No normalized shares are stored here, and AutoMovieMotionMeeting owns alignment and conversion between origins.
