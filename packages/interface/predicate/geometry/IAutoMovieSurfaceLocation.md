# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation

## @evidence contracts/development/common.md#meaningful-documentation

The declaration defines one incident-face address, dimensionless chart coordinates and an optional sweep-domain address. It explains the authoring requirement at a seam and the relationship between chart and sweep coordinates.

## @evidence contracts/development/design.md#principled-representation

The Engine's `locateSurfaceVertices` verifies that the cage's patch names agree with the network. It checks face and U/V query presence, interpolates chart coordinates bilinearly and reads the named owning patch. It produces a sweep address for sweep and transition patches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vertex describes where to evaluate a field on the network. The record carries its chart coordinates and patch name, plus sweep-domain data for the patch variants that supply it. The displayed position and projection are separate operations.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.ISweepAddress

## @evidence contracts/development/common.md#meaningful-documentation

The named record identifies the owning sweep and the two coordinates in its domain. It explains the chart mapping and why opposite seam endpoints can differ by one turn.

## @evidence contracts/development/design.md#principled-representation

For sweep and transition patches, `locateSurfaceVertices` maps chart T across the patch's U range and chart S across its V range. The patch's declared sweep selects the parameter system.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The address gives consumers the original sweep key and domain point. The patch coordinate remains on the parent record, and neither a world point nor a projected distance is part of the address.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.coordinate

## @evidence contracts/development/common.md#meaningful-documentation

Documents the new allocated patch index and S/T for one incident cage face. The locator constructs the record from four face-corner contributions.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.name

## @evidence contracts/development/common.md#meaningful-documentation

Documents the name in network patch order. The locator selects it by the coordinate's patch index.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Documents the optional domain address. The locator fills it only for a sweep or transition patch.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.ISweepAddress.name

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the network sweep key copied from the generating patch.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.ISweepAddress.u

## @evidence contracts/development/common.md#meaningful-documentation

Documents the normalized spine coordinate reconstructed from T and the patch's U interval.

# src/geometry/IAutoMovieSurfaceLocation.ts#IAutoMovieSurfaceLocation.ISweepAddress.v

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unwrapped section parameter from S and the patch's V interval. A seam address can retain either endpoint.
