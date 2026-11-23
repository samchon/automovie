# src/motion/IAutoMoviePathFrame.ts#IAutoMoviePathFrame

## @evidence contracts/development/design.md#principled-representation

Records one arc-length path sample and its corner-blended yaw, with a horizontal unit tangent reconstructed from that same yaw so downstream facing data cannot diverge within the frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Baseline placement facts accompany the baked clip without duplicating gait joints or root bob, which remain in motion keyframes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tangent is explicitly facing data rather than an unmeasured path velocity; world height comes from the supplied ground source for every waypoint sequence.

## @evidence contracts/development/common.md#meaningful-documentation

Gives local seconds, world coordinates, degree axis convention and the distinction between baseline facing and actual root velocity.
