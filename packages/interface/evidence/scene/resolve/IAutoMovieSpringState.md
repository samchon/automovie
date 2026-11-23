# src/scene/resolve/IAutoMovieSpringState.ts#IAutoMovieSpringState

## @evidence contracts/development/design.md#principled-representation

Retain previous and post-spring joint positions for Verlet stepping plus previous centre translations keyed by the centre/ordered-chain tuple, so distinct chains sharing a centre compensate independently.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three explicit maps distinguish integrator history, centre translation transport and reseeding a freshly composed frame from prior spring output.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Centre transport is translation-only; state is not a full rigid-body history and shared physical joints still share joint-position entries.

## @evidence contracts/development/common.md#meaningful-documentation

Members document opaque chain keys, initially empty maps and in-place ownership; no automatic driver-removal eviction is promised.
