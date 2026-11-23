# src/scene/IAutoMovieInstancedGeometry.ts#IAutoMovieInstancedGeometry

## @evidence contracts/development/design.md#principled-representation

A merged rigid rest-space BufferGeometry retains group-to-material ordering and source material identity while cloning vertex storage, so instance consumers share one prototype without mutating adopted source geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometry ownership and material borrowing are expressed separately because generated-model and adopted-object entries acquire materials from different owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rigid flattening refuses unsupported skinned/morphed parts in its producer rather than presenting a static substitute under this interface.

## @evidence contracts/development/common.md#meaningful-documentation

States rest-space metre units, owned geometry, material ordering and the ownership difference between generated and adopted entry points.
