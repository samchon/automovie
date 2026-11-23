# src/human/generation/arm/IAutoMovieHumanArmSources.ts#IAutoMovieHumanArmSources.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Source-only capabilities; no full body, raw loft or proximal join is implied.

## @evidence contracts/development/design.md#principled-representation `digitNames`: Existing digit names without authoring their geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmSources.create. Also types AutoMovieHumanLimbSources.arms, AutoMovieHumanLimbSources.previous.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `digitNames`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmSources.ts#IAutoMovieHumanArmSources.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The arm's actual inputs; no other source, curve or mesh is required.

## @evidence contracts/development/design.md#principled-representation `side`: Side-qualified source names. `rest`: The same direct rest definition later used by bind bones. `arms`: Public arm/hand dimensions, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmSources.names, AutoMovieHumanArmSources.create. Also types AutoMovieHumanArmSources.side, AutoMovieHumanArmSources.{ shoulder, elbow, wrist }.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `side`, `rest`, `arms`, `measures`, `scale`; callers supply the complete record.
