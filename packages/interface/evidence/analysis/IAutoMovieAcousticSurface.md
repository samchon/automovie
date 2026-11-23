# src/analysis/IAutoMovieAcousticSurface.ts#IAutoMovieAcousticSurface

## @evidence contracts/development/design.md#principled-representation

Sabine absorption area is the sum of `area * alpha` over surfaces, and both extremes of the mean coefficient leave no finite diffuse field, which is why they become gaps rather than numbers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An id, an area and one broadband coefficient, matching the broadband Sabine model; no octave-band absorption is carried because the solver does not read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The anechoic extreme is reported as a gap even though Sabine's formula would return a finite decay there, instead of publishing a value the model does not justify.

## @evidence contracts/development/common.md#meaningful-documentation

States the contribution to the absorption area, both gap conditions, the m^2 unit, the closed `[0, 1]` coefficient range, and id uniqueness.
