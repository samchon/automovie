# src/physics/IAutoMovieCollectPhysicalSupports.ts#IAutoMovieCollectPhysicalSupports.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the collider carrier, world application point and source of the friction coefficient.

## @evidence contracts/development/design.md#principled-representation

World metres and a dimensionless combined Coulomb coefficient describe one measured floor constraint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

collectPhysicalSupports copies manifold facts for support-wrench allocation; no native manifold handle escapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The carrier is the segment actually owning the contact, which may differ from the pattern endpoint.

# src/physics/IAutoMovieCollectPhysicalSupports.ts#IAutoMovieCollectPhysicalSupports.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

Separates actual floor samples from the positive-impulse loaded flag.

## @evidence contracts/development/design.md#principled-representation

Extends the canonical balance support with constraint samples; loaded distinguishes a touching constraint from measured positive load.

## @evidence contracts/development/design.md#minimal-and-owned-surface

collectPhysicalSupports supplies balance assessment and wrench allocation from one collected contact population.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero-load constraints remain available to allocation; a nominal full sole is never substituted for measured points.
