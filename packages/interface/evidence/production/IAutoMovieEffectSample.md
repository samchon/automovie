# src/production/IAutoMovieEffectSample.ts#IAutoMovieEffectSample

## @evidence contracts/development/design.md#principled-representation

Requested time decides exact interval membership, and fixed-step state uses an opening bound and a guard against rounding into the exclusive end. The result depends on the compiled stream and explicit sampling coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields: the snapped time, the active flag, the interpolated intensity and the particle list, so a renderer needs nothing beyond this record to draw the effect at that instant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An inactive window yields an explicit inactive sample with zero intensity rather than an absent value a caller would have to guess at, and the LOD thinning rule is the recipe's own distance, not a per-camera exception.

## @evidence contracts/development/common.md#meaningful-documentation

States how the time is snapped, the half-open active window, the linear intensity law and its zero when inactive, and the order, thinning rule and budget cap of the particle list.
