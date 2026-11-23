# src/render/IAutoMovieSequenceRenderTransitionSpan.ts#IAutoMovieSequenceRenderTransitionSpan

## @evidence contracts/development/design.md#principled-representation

An incoming entry identifies the outgoing and incoming shots and one transition interval on the global output clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The manifest names transition timing independently from sampled blend weights because hosts may inspect editorial spans without visiting every frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Transition kind and duration are the authored values resolved by the timeline, with no shot-name exception.

## @evidence contracts/development/common.md#meaningful-documentation

Members state incoming entry indexing, endpoints, kind and the start, end and overlap duration in seconds.
