# src/render/delivery/IAutoMovieAssertCaptureClockExpected.ts#IAutoMovieAssertCaptureClockExpected

## @evidence contracts/development/design.md#principled-representation

Commissioned duration and rate to compare with a capture host. assertAutoMovieCaptureClock compares them exactly rather than rounding or independently validating their positivity; the commissioning boundary owns numeric admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

assertAutoMovieCaptureClock exchanges durationSeconds, fps; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Commissioned duration and rate to compare with a capture host. assertAutoMovieCaptureClock compares them exactly rather than rounding or independently validating their positivity; the commissioning boundary owns numeric admission.

## @evidence contracts/development/common.md#meaningful-documentation

Commissioned duration and rate to compare with a capture host. assertAutoMovieCaptureClock compares them exactly rather than rounding or independently validating their positivity; the commissioning boundary owns numeric admission. The prose and members document how assertAutoMovieCaptureClock interprets and admits these values.
