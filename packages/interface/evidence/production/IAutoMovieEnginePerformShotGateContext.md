# src/production/IAutoMovieEnginePerformShotGateContext.ts#IAutoMovieEnginePerformShotGateContext

## @evidence contracts/development/design.md#principled-representation

The tables are derived once from the staged scene and the compiled formations, the placements by `scenePlacements` and the formation points by the same cue transform the ground gate uses, so every gate reads one placement per id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record instead of a dozen parameters per gate, holding only what more than one gate reads; values a single gate needs stay that gate's parameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries the caller's own lookups and staged scene unchanged; no gate receives a different table or a fixture-specific override.

## @evidence contracts/development/common.md#meaningful-documentation

States who builds it and when, who reads it, that only the collector is written, and for each field its source, frame and the meaning of an absent lookup.
