# src/motion/human/compose/IAutoMovieMotionMeetingKind.ts#IAutoMovieMotionMeetingKind

## @evidence contracts/development/common.md#meaningful-documentation

A reusable meeting law declaring roles, contact targets and timing, with optional placement and coupling capabilities. AutoMovieMotionMeeting resolves it against the participating performers.

## @evidence contracts/development/design.md#principled-representation

A kind is what differs between mutual actions: who takes part, where they touch and how long each takes to get there. The frame, the order and the shared instants are the same for all and are computed by `of`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Handshake, handover, high-five and carried-coupling laws provide meeting kinds; AutoMovieMotionMeeting supplies their shared role/frame/timing resolution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Roles and contact defaults are explicit, while optional place/couple capabilities retain their documented fallback behavior. The meeting runtime owns role admission rather than this pure callback interface.

# src/motion/human/compose/IAutoMovieMotionMeetingKind.ts#IAutoMovieMotionMeetingKind.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

The world point measures metres. The outward world normal defines facing.

## @evidence contracts/development/design.md#principled-representation

The two fields reuse target geometry. The declaring kind supplies a usable direction because the vector type cannot constrain length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kind supplies the contact and the meeting converts its facing into the shared frame for both roles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Picking the existing target fields preserves their definitions without duplicating the geometry format.
