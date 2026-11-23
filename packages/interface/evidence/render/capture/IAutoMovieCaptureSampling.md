# src/render/capture/IAutoMovieCaptureSampling.ts#IAutoMovieCaptureSampling

## @evidence contracts/development/design.md#principled-representation

The two ways to choose seconds need different data, so they are a union keyed by `kind`, and a request cannot give a rate with explicit seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The capture grammar and frame planner exchange the sampling policy independently of the remaining capture request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The subject's end is null rather than a number guessed before the subject is known.

## @evidence contracts/development/common.md#meaningful-documentation

States each form's rule, units and what a null end means.
