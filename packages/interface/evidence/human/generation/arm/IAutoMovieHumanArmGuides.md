# src/human/generation/arm/IAutoMovieHumanArmGuides.ts#IAutoMovieHumanArmGuides

## @evidence contracts/development/common.md#meaningful-documentation

A section-shape evaluator indexed by distance along the arm walk. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only ShapeResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

ShapeResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanArmGuides exchanges the named ShapeResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/arm/IAutoMovieHumanArmGuides.ts#IAutoMovieHumanArmGuides.ShapeResult

## @evidence contracts/development/common.md#meaningful-documentation

The normalised section at any walk length.

## @evidence contracts/development/design.md#principled-representation

The normalised section at any walk length. The callable takes s and returns IAutoMovieHumanArmTube.IShape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmGuides.ShapeResult is the canonical exchange used by AutoMovieHumanArmGuides.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmGuides.shape for the normalised section at any walk length.
