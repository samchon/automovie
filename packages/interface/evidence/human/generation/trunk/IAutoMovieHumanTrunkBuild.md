# src/human/generation/trunk/IAutoMovieHumanTrunkBuild.ts#IAutoMovieHumanTrunkBuild.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the build reads.

## @evidence contracts/development/design.md#principled-representation `legs`: Same original leg definitions consumed by production lofts, before either tape pass builds its parent contact. `bindLeg`: Same regional factory publishes each trial/final leg against that exact parent; no independent hip estimate. `views`: The base's views (`AutoMovieHumanTrunkViews.of`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkBuild.withHead. Read by AutoMovieHumanTrunkBuild.withHead, AutoMovieHumanTrunkBuild.create, AutoMovieHumanTrunkBuild.define. Also types AutoMovieHumanBodyPreparation.original, AutoMovieHumanTrunkBuild.firstInput.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `legs`: Same original leg definitions consumed by production lofts, before either tape pass builds its parent contact. `bindLeg`: Same regional factory publishes each trial/final leg against that exact parent; no independent hip estimate. `top`: Retained upper scalar support on the head axis.

# src/human/generation/trunk/IAutoMovieHumanTrunkBuild.ts#IAutoMovieHumanTrunkBuild.IMassLaw

## @evidence contracts/development/common.md#meaningful-documentation

A mass's law on the left side, in calibration mm.

## @evidence contracts/development/design.md#principled-representation `target`: Declared AP skin apex on the left, calibration mm; its height and transverse place must not move during wall placement. `up`: The up direction of its footprint. `footprint`: Footprint edges at the base, along up, lateral, down and medial, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMassInterim.breast, AutoMovieHumanMassInterim.gluteal, AutoMovieHumanTrunkBuild.mirror. Read by AutoMovieHumanTrunkBuild.mirror. Also types AutoMovieHumanMassInterim.DOME, AutoMovieHumanTrunkBuild.pairs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `target`, `up`, `footprint`, `profile`, `shoulder`, `fold`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkBuild.ts#IAutoMovieHumanTrunkBuild.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

What the build publishes.

## @evidence contracts/development/design.md#principled-representation `sections`: Common original measurement planes consumed by both preparation passes. `trunk`: The base's view node, or null when it cannot be lofted. `masses`: Each mass's fold onto the base, for the body's tree.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaw.trunkSource, AutoMovieHumanBodyPreparation.trunkSource, AutoMovieHumanTrunkBuild.create. Read by AutoMovieHumanTrunkBuild.create. Also types AutoMovieHumanBodyLane.trunk, AutoMovieHumanBodyPreparation.result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `sections`, `trunk`, `masses`, `diagnostics`, `sources`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkBuild.ts#IAutoMovieHumanTrunkBuild.IWithHeadHead

## @evidence contracts/development/common.md#meaningful-documentation

Preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain.

## @evidence contracts/development/design.md#principled-representation

Preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain. Alternatives are a record with part, crown; undefined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkBuild.IWithHeadHead is the canonical exchange used by AutoMovieHumanTrunkBuild.withHead.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkBuild.withHead for preserve the existing upper scalar support from the canonical head axis; the regular shared connection excludes that support's dome from the loft domain.
