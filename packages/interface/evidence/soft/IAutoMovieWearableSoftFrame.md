# src/soft/IAutoMovieWearableSoftFrame.ts#IAutoMovieWearableSoftFrame

## @evidence contracts/development/design.md#principled-representation

One step joins node and actor frames that must be temporally coherent before local anchors and body capsules become one cloth boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Primary-motion evaluation stays with the caller, while simulateAutoMovieWearableSoftBody consumes plain snapshots rather than a playback or rendering service.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Complete zero-through-target snapshot admission refuses missing steps and named participants instead of reusing a stale prior frame.

## @evidence contracts/development/common.md#meaningful-documentation

States absolute step and the evaluated node/actor populations that constitute that step's supplied frame.
