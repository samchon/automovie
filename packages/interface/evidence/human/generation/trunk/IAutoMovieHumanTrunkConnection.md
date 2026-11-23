# src/human/generation/trunk/IAutoMovieHumanTrunkConnection.ts#IAutoMovieHumanTrunkConnection

## @evidence contracts/development/common.md#meaningful-documentation

Describes native neck boundary fields and physical-station frame derivatives before coefficient construction; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Native neck boundary fields and physical-station frame derivatives before coefficient construction. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanTrunkConnection; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing TrunkConnection contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/trunk/IAutoMovieHumanTrunkConnection.ts#IAutoMovieHumanTrunkConnection.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

One actual native generating boundary and frame2; this original view declares no additional phase lift.

## @evidence contracts/development/design.md#principled-representation `boundary`: Actual regular neck boundary, before any coefficient layer exists. `field`: Whole phase family, not just four supports or fitted coefficients.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkConnection.normal. Read by AutoMovieHumanTrunkConnection.apply, AutoMovieHumanTrunkViews.of. Also types AutoMovieHumanNeckBoundary.inputs, AutoMovieHumanNeckBoundary.connection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `boundary`, `field`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkConnection.ts#IAutoMovieHumanTrunkConnection.IBoundary

## @evidence contracts/development/common.md#meaningful-documentation

Actual original section plane and its available physical-station derivatives; no coefficient layer is manufactured.

## @evidence contracts/development/design.md#principled-representation `y`: Physical world-height station, calibration millimetres. `frame`: Original world origin and fixed +X/+Z basis. `frameSlopes`: Actual first derivative in physical station millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkConnection.IBoundary is the canonical exchange used by IAutoMovieHumanTrunkConnection.IDefinition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `frame`, `frameSlopes`, `frameCurvatures`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkConnection.ts#IAutoMovieHumanTrunkConnection.IConnection

## @evidence contracts/development/common.md#meaningful-documentation

A boundary read from an actual interval part additionally retains that part's original declarations.

## @evidence contracts/development/design.md#principled-representation `original`: Actual preloft source ownership retained by both original consumers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkConnection.captureOriginal. Also types AutoMovieHumanTrunkConnection.inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `original`; callers supply the complete record.
