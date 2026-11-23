# src/fluid/AutoMovieWaterFeatureMode.ts#AutoMovieWaterFeatureMode

## @evidence contracts/development/design.md#principled-representation `lowerWaterFeature` calls `simulateFluidDomain(domain, 0)` for `static` and `sampleFluidDomain(domain, time)` otherwise, so the mode chooses which absolute step is read and never changes the solve itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three values separate a frozen pool from a solved one and mark the solved one for ripple scrolling; a separate surface-animation flag would duplicate the third distinction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Flowing and simulated differ only in viewer metadata, without changing the shared same-time solve; static deliberately selects another step. No stock shader consumes the flowing flag and no production shot-frame caller wires the lowering/viewer pair.

## @evidence contracts/development/common.md#meaningful-documentation

States the zero-versus-snapped step choice, the same-time premise for solved modes, permitted static/solved disagreement, flowing metadata, closed admission and absent per-frame shot wiring.
