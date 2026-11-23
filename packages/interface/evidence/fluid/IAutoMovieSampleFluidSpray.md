# src/fluid/IAutoMovieSampleFluidSpray.ts#IAutoMovieSampleFluidSpray.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Describes current-state nozzle heights, second-based particle ages, deterministic thinning, caps, ownership and the actual refusal conditions.

## @evidence contracts/development/design.md#principled-representation

Canonical metre-domain and second-based state data feed ballistic positions; cameraDistance is a metre LOD input, with runtime finiteness admission and zero default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sampleFluidSpray and lowerWaterFeature share domain/state identities; the optional distance is the sampler's only additional input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hidden history or renderer handle is represented; state compatibility and representable live-window arithmetic are explicit caller premises.
