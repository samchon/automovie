# src/human/generation/arm/IAutoMovieHumanArmGuides.ts#IAutoMovieHumanArmGuides

## @evidence contracts/development/common.md#meaningful-documentation

A section-shape evaluator indexed by distance along the arm walk. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace owns the section shape and the function returning it at a walk station.

## @evidence contracts/development/design.md#principled-representation

`IShape` carries the polar guides and a fullness value for each. The guide producer validates their geometry in the source frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`AutoMovieHumanArmGuides.shape` returns `ShapeResult` and uses the same `IShape` for all span inputs.

# src/human/generation/arm/IAutoMovieHumanArmGuides.ts#IAutoMovieHumanArmGuides.ShapeResult

## @evidence contracts/development/common.md#meaningful-documentation

The normalised section at any walk length.

## @evidence contracts/development/design.md#principled-representation

The callable takes a walk length and returns `IAutoMovieHumanArmGuides.IShape`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmGuides.ShapeResult is the canonical exchange used by AutoMovieHumanArmGuides.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The function reads the normalised source shape at the requested walk station.

# src/human/generation/arm/IAutoMovieHumanArmGuides.ts#IAutoMovieHumanArmGuides.IShape

## @evidence contracts/development/common.md#meaningful-documentation

The normalised polar-section shape at one walk length.

## @evidence contracts/development/design.md#principled-representation

The shape pairs polar guides in increasing angle with one fullness share per guide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shape is the return value of `AutoMovieHumanArmGuides.shape`'s station function.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shape carries only its guides and fullness shares.
