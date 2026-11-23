# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck

## @evidence contracts/development/common.md#meaningful-documentation

Names the release clock, duration, rigid placements, initial velocity and solver floor.

## @evidence contracts/development/design.md#principled-representation

One rigid profile and world placement per object. The ball adds its velocity from the displayed release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input to bakePrecisionDeck; physical bodies, floor bounds and playback retain their shared contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actor motion stays outside the physical deck solve. The ball and each target keep their own stable scene identity.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.IRigid

## @evidence contracts/development/common.md#meaningful-documentation

States identity, one-segment physics and world placement.

## @evidence contracts/development/design.md#principled-representation

Uses the profile's sole root segment as the rigid object.

## @evidence contracts/development/design.md#minimal-and-owned-surface

bakePrecisionDeck prepares the shared native solver's authored frames from this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rigid means exactly one segment. The world pose is the segment origin, not its centre of mass.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.IBall

## @evidence contracts/development/common.md#meaningful-documentation

Adds the world linear velocity at release, m/s, to the placed rigid ball.

## @evidence contracts/development/design.md#principled-representation

The release velocity comes from the performer's displayed flight, so the solver continues the same ball.

## @evidence contracts/development/design.md#minimal-and-owned-surface

bakePrecisionDeck reads the velocity for the first solver interval only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Spin is not authored; surface contact develops it.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.ITargetContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the struck target and the film second of its first positive solver impulse.

## @evidence contracts/development/design.md#principled-representation

Film seconds are the release plus the cache's local receipt time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by callers that cut or cue on the impact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent for a miss rather than encoded by a sentinel.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.IPocket

## @evidence contracts/development/common.md#meaningful-documentation

Names the pocket and its mouth centre at bed height, world metres.

## @evidence contracts/development/design.md#principled-representation

The mouth point's height is the bed plane a pocketed ball falls below.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by pocketedBalls; a table's pocket sockets or a green's cup supply it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The opening itself is the surface's geometry; this point only names which mouth a ball fell through.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.IPocketed

## @evidence contracts/development/common.md#meaningful-documentation

Names the ball, the pocket and the film second it fell wholly below the bed.

## @evidence contracts/development/design.md#principled-representation

Film seconds are the release plus a cache frame time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by pocketedBalls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A ball still on the bed at the cache end is absent, not credited to a sentinel pocket.

# src/motion/human/sport/IAutoMovieMotionHumanPrecisionDeck.ts#IAutoMovieMotionHumanPrecisionDeck.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the release offset, local replay and the optional first ball-to-target contact.

## @evidence contracts/development/design.md#principled-representation

Each body is read as cache.at(filmSeconds - release); the cache's solver receipts hold every later contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the shared collision and replay owners; consumers continue or cut the motion and credit the sport's result from the cache.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A miss leaves firstTarget absent. No continuous-time impact beyond the solver receipt is inferred.
