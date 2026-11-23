# src/render/capture/IAutoMovieCaptureFramePlanProps.ts#IAutoMovieCaptureFramePlanProps

## @evidence contracts/development/design.md#principled-representation

Sampling is already admitted by parseAutoMovieCapturePlanRequest; range rates and ordering are its responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieCaptureFrames exchanges durationSeconds, fps, sampling, events, cuts, window; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ordinary range samples stop before to, while explicit instants can include the duration boundary.

## @evidence contracts/development/common.md#meaningful-documentation

Subject-local sampling and event windows. planAutoMovieCaptureFrames validates finite positive fps/duration, a nonnegative safe-integer window, and in-range explicit/event/cut seconds. The prose and members document how planAutoMovieCaptureFrames interprets and admits these values.
