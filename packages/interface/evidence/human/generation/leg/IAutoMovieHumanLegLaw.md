# src/human/generation/leg/IAutoMovieHumanLegLaw.ts#IAutoMovieHumanLegLaw.IFamily

## @evidence contracts/development/common.md#meaningful-documentation

The fitted law's channels with one person's keys.

## @evidence contracts/development/design.md#principled-representation `bottom`: Station of the ankle ring. `length`: Distance between the rings. `ankle`: Ankle ring centre in the canonical plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegLaw.prepare. Read by AutoMovieHumanLegLaw.reachOf, AutoMovieHumanLegLaw.bare, AutoMovieHumanLegLaw.points. Also types AutoMovieHumanLegLaw.family.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bottom`, `length`, `ankle`, `ankleWorld`, `ankleLift`, `crotchOffset`, `crotchCentre`, `inputs`, `profile`, `forward`, `axis`, `shape`, `correction`, `ankleResidual`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegLaw.ts#IAutoMovieHumanLegLaw.IBare

## @evidence contracts/development/common.md#meaningful-documentation

Section of the law before any end residual.

## @evidence contracts/development/design.md#principled-representation `centre`: Centre in the canonical plane, `[x, z]`. `radii`: Radii at the leg's phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegLaw.bare. Also types AutoMovieHumanLegLaw.reached, AutoMovieHumanLegLaw.start.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `radii`; callers supply the complete record.
