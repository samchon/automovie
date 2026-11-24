# src/render/IAutoMovieSequenceRenderFrame.ts#IAutoMovieSequenceRenderFrame

## @evidence contracts/development/design.md#principled-representation

One output index and global sample time resolve to a shot-local time and an optional outgoing tail with the transition's progress and kind, so a host weighs a dissolve and a fade as `IAutoMovieTransition` states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record carries the engine-resolved playback decision directly to capture, keeping editorial logic out of host adapters; the kind is carried because the progress alone cannot tell a dissolve's mix from a fade's dip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A hard cut is explicitly null rather than a manufactured blend, and outgoing samples preserve their own shot identity and local second.

## @evidence contracts/development/common.md#meaningful-documentation

Properties specify zero-based indexing, global and local seconds, destination path, null hard cuts, the progress in the half-open unit interval and what each kind weighs.
