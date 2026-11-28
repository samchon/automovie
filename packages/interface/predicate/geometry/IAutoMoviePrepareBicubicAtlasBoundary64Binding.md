# src/geometry/IAutoMoviePrepareBicubicAtlasBoundary64Binding.ts#IAutoMoviePrepareBicubicAtlasBoundary64Binding

## @evidence contracts/development/common.md#meaningful-documentation

The record distinguishes a patch edge's explicit binding from a normalized legacy peer and explains the different object ownership.

## @evidence contracts/development/design.md#principled-representation

Boundary preparation borrows explicit source bindings and creates transported ones with the canonical four-control tuple used by the vertex owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared result reuses the tessellation boundary binding and adds only the optional legacy fan address.

# src/geometry/IAutoMoviePrepareBicubicAtlasBoundary64Binding.ts#IAutoMoviePrepareBicubicAtlasBoundary64Binding.ILegacyFan.legacy

## @evidence contracts/development/common.md#meaningful-documentation

The optional string identifies a transported fan by its canonical four-control-ID tuple and is absent for an explicit binding.

# src/geometry/IAutoMoviePrepareBicubicAtlasBoundary64Binding.ts#IAutoMoviePrepareBicubicAtlasBoundary64Binding.ILegacyFan

## @evidence contracts/development/common.md#meaningful-documentation

The record documents the optional canonical four-control tuple and its absence on explicit bindings.

## @evidence contracts/development/design.md#principled-representation

The boundary preparer writes the tuple only when transporting legacy complete-edge peers. The vertex owner reads its presence to choose the legacy normal fan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This extension adds one optional identity. Patch-side addressing and authority restrictions remain on the tessellation binding.
