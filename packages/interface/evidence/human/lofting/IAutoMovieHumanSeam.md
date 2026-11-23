# src/human/lofting/IAutoMovieHumanSeam.ts#IAutoMovieHumanSeam

## @evidence contracts/development/common.md#meaningful-documentation

A declared seam between two pieces of a divided part, as data.

## @evidence contracts/development/design.md#principled-representation `name`: Seam identity in findings, such as `hand.web-2` or `head.face/P`. `owner`: Piece that evaluates the shared curve and publishes its jet. `neighbour`: Piece that copies the owner's jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSeam belongs to IAutoMovieHumanSeam; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `owner`, `neighbour`, `curve`, `continuity`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanSeam.ts#IAutoMovieHumanSeam.ISurfaceJet

## @evidence contracts/development/common.md#meaningful-documentation

A surface's parametric 2-jet at one point of a seam (rules J4 and J5), world millimetres.

## @evidence contracts/development/design.md#principled-representation `point`: Point on the seam, mm. `along`: First derivative along the seam. `alongSecond`: Second derivative along the seam.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanSeam.reflect. Read by AutoMovieHumanSeam.ribbon, AutoMovieHumanSeam.reflect, AutoMovieHumanSeam.measure. Also types AutoMovieHumanTrunkQuadrant.mirrored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `along`, `alongSecond`, `across`, `acrossSecond`, `twist`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanSeam.ts#IAutoMovieHumanSeam.Continuity

## @evidence contracts/development/common.md#meaningful-documentation

Order of geometric contact across a seam.

## @evidence contracts/development/design.md#principled-representation

Order of geometric contact across a seam. The closed alternatives are "G0", "G1", "G2".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanSeam.violations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSeam.violations for order of geometric contact across a seam.
