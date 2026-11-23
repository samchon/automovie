# src/fluid/IAutoMovieFluidSurfaceGeometry.ts#IAutoMovieFluidSurfaceGeometry.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States cell placement, normal/flow construction, wet-quad selection, empty bounds, borrowed inputs and the identity-only check.

## @evidence contracts/development/design.md#principled-representation

The domain supplies world metre placement and grid topology; the state supplies metre depths and metre-per-second face velocities. Compatible layouts and finite arithmetic remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the canonical fluid domain/state consumed by fluidSurfaceGeometry and lowerWaterFeature, without a second mesh input representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both records are required; matching ids are checked at runtime without claiming they prove array provenance or numerical safety.
