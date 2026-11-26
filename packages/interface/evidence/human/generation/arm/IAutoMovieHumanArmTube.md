# src/human/generation/arm/IAutoMovieHumanArmTube.ts#IAutoMovieHumanArmTube.IShape

## @evidence contracts/development/common.md#meaningful-documentation

A section's normalised shape at a walk length.

## @evidence contracts/development/design.md#principled-representation `guides`: The guides by increasing angle. `fullness`: One per guide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmGuides.shape. Read by AutoMovieHumanArmTube.build. Also types AutoMovieHumanArmTube.own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `guides`, `fullness`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmTube.ts#IAutoMovieHumanArmTube.ITube

## @evidence contracts/development/common.md#meaningful-documentation

The tube.

## @evidence contracts/development/design.md#principled-representation `axis`: Its axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmTube.build. Read by AutoMovieHumanArmTube.controls. Also types AutoMovieHumanArmLaw.tube.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `axis`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmTube.ts#IAutoMovieHumanArmTube.BuildShape

## @evidence contracts/development/common.md#meaningful-documentation

The tube from its axis, shape, reliefs and girth law.

## @evidence contracts/development/design.md#principled-representation

The tube from its axis, shape, reliefs and girth law. The callable takes s and returns IShape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmTube.BuildShape is the canonical exchange used by AutoMovieHumanArmTube.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmTube.build for the tube from its axis, shape, reliefs and girth law.

# src/human/generation/arm/IAutoMovieHumanArmTube.ts#IAutoMovieHumanArmTube.BuildTarget

## @evidence contracts/development/common.md#meaningful-documentation

The tube from its axis, shape, reliefs and girth law.

## @evidence contracts/development/design.md#principled-representation

The tube from its axis, shape, reliefs and girth law. The callable takes s and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmTube.BuildTarget is the canonical exchange used by AutoMovieHumanArmTube.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmTube.build for the tube from its axis, shape, reliefs and girth law.
