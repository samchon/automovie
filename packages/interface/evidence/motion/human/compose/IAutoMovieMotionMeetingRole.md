# src/motion/human/compose/IAutoMovieMotionMeetingRole.ts#IAutoMovieMotionMeetingRole

## @evidence contracts/development/common.md#meaningful-documentation

A participating performer's named role and resolved body frame for meeting negotiation. The borrowed bones expose world placement without allowing the meeting to replace the rig.

## @evidence contracts/development/design.md#principled-representation

What a kind needs to place contacts and time a role: who it is, its body, where it stands and where its bones are at the start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Meeting providers receive the participant body, root/yaw and borrowed resolved bone placement needed for contact negotiation; authored performer configuration remains separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The readonly bone view exposes world position/rotation without granting rig mutation. AutoMovieMotionMeeting and its caller own participant lookup and preparation.
