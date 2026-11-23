# src/render/delivery/IAutoMovieAssertCaptureClockHost.ts#IAutoMovieAssertCaptureClockHost

## @evidence contracts/development/design.md#principled-representation

This observation is not a proof that all frames have been drawn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

assertAutoMovieCaptureClock exchanges ready, durationSeconds, fps, frameCount; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This observation is not a proof that all frames have been drawn.

## @evidence contracts/development/common.md#meaningful-documentation

Capture host readiness and the full advertised presentation clock. assertAutoMovieCaptureClock requires ready, exact expected duration/rate equality and a safe-integer frameCount equal to their product. The prose and members document how assertAutoMovieCaptureClock interprets and admits these values.
