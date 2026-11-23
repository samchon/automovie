# src/production/IAutoMovieShotEffectCue.ts#IAutoMovieShotEffectCue

## @evidence contracts/development/design.md#principled-representation

Explicit validateAutoMovieEffects checks unique ids, matching compiled stream timing, zone, envelope and event binding, half-open shot intervals, bounded intensity and same-zone chronology. Optional events must appear in the contract/sample tables with finite times inside the cue. realizeShotContract owns predicate realization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cue owns activation and envelope while the world zone owns spatial bounds, recipe, seed and budget, keeping authored timing separate from deterministic effect materialization.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing compiled counterparts and absent or numerically out-of-cue event samples produce diagnostics when validation is explicitly called. The bare materializer drops unresolved world references; this type installs no automatic validator or complete event-realization gate.

## @evidence contracts/development/common.md#meaningful-documentation

Defines unique cue and zone identity, inclusive/exclusive seconds, intensity endpoints and optional authoritative event binding.
