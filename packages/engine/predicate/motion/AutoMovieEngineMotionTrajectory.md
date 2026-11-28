# src/motion/AutoMovieEngineMotionTrajectory.ts#AutoMovieEngineMotionTrajectory.followPathMotion

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the admitted gait and timing inputs, path and height frames, corner-width units and default, whole-cycle rule, and failure conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Horizontal stretches determine arc length. Rounding intended travel time to whole gait cycles yields the authored arrival duration, and dividing length by that duration yields the effective pace. Invalid pace, gait duration and turn width fail before traversal. An overflowing baked duration fails before keyframes are produced. Tangent yaw places the gait's local offsets in the travel frame, with a shortest-turn blend capped by adjacent half-stretches.

## @evidence contracts/development/implementation.md#efficient-algorithms

The baker prepares stretches and corner widths once per path. It visits each gait key per baked cycle and locates its stretch by the cumulative arc index. A repeated boundary key is coalesced into the existing seam. The returned clip and frames account for the retained per-key storage, and the prepared geometry stays local to the invocation.
