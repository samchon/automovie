# src/architecture/IAutoMovieBuiltPlacementSupportLocator.ts#IAutoMovieBuiltPlacementSupportLocator

## @evidence contracts/development/design.md#principled-representation

Extends the body locator with a `surface` arm; `builtEnvironmentSupportStatus` resolves a body to the top face of its box or bearing part and a surface to its footprint polygon and authored height rule with the `surface-height-rule` basis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A union over the existing body locator plus one arm, so a support may be any body the overlap queries already address or an authored surface, without a parallel element or population arm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Multi-part selection minimizes absolute top-to-subject-underside distance among strictly overlapping XZ boxes, retaining the first equal-distance candidate; it can choose a part above the underside. With no positive-area overlap it uses the first part for the subsequent probe, not an invented union face. A surface with no convex footprint piece is unresolved, and all faces remain static box/height proxies rather than physical load-bearing certificates.

## @evidence contracts/development/common.md#meaningful-documentation

States how each arm finds its bearing face, the part choice for multi-part elements including the no-overlap case, and when a surface support is unresolved.
