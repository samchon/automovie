# src/harness/IAutoMovieOffscreenTarget.ts#IAutoMovieOffscreenTarget

## @evidence contracts/development/design.md#principled-representation

An edge is a direction in the camera's frame, so a closed set of four names states the intent without coordinates for a future resolver to map through the framing camera.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed field is the whole target, kept apart from the actor-relative `IAutoMovieDirectionTarget` because the two are relative to different frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The engine does not guess a world point for an edge; the locomote synthesizer steps in place and every other verb refuses it, and the gap is stated here.

## @evidence contracts/development/common.md#meaningful-documentation

States the intended use, that nothing resolves it and why, and exactly what each verb does with it today; the member lists the edges.
