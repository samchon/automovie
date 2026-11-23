# src/scene/IAutoMovieProductionLighting.ts#IAutoMovieProductionLighting

## @evidence contracts/development/design.md#principled-representation

Shared light shapes and pointer sampling evaluate story seconds mapped by an explicit pin. The production caller currently samples only shot second zero, then merges shot-local lights by id; this is opening-state inheritance rather than a wired through-shot production animation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One production light population and motion list establish cross-shot authority without duplicating a clock or repeating the same source on every shot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unpinned shots inherit no invented epoch state, and absent production lighting preserves the shot-only path; motion ids and channels still owe existing light admission.

## @evidence contracts/development/common.md#meaningful-documentation

Defines epoch state, story-second channels, pin mapping, omission and current opening-only inheritance; shot-local tracks own continued animation.
