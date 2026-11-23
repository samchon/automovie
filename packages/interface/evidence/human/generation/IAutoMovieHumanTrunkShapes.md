# src/human/generation/IAutoMovieHumanTrunkShapes.ts#IAutoMovieHumanTrunkShapes

## @evidence contracts/development/common.md#meaningful-documentation

Describes dimensionless trunk section proportions and explicitly fitted shoulder observations; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Dimensionless trunk section proportions and explicitly fitted shoulder observations. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanTrunkShapes; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing TrunkShapes contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanTrunkShapes.ts#IAutoMovieHumanTrunkShapes.IShape

## @evidence contracts/development/common.md#meaningful-documentation

The shape at one station.

## @evidence contracts/development/design.md#principled-representation `depthRatio`: Depth over breadth: front plus back depth over twice the half width. `frontShare`: The front depth's share of the whole depth. `middle`: Forward place of the widest point, a share of stature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkShapes.key. Also types AutoMovieHumanTrunkShapes.CROTCH, AutoMovieHumanTrunkShapes.BUTTOCK.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `depthRatio`, `frontShare`, `middle`, `squareFront`, `squareBack`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkShapes.ts#IAutoMovieHumanTrunkShapes.IShoulder

## @evidence contracts/development/common.md#meaningful-documentation

At the shoulder point: the front and back midlines' places and the widest point's as shares of stature, and the squareness, read at 0.894 of the span (m1 and m2; the women's loops there are open).

## @evidence contracts/development/design.md#principled-representation `front`: Front midline's forward place as a fraction of stature. `back`: Back midline's forward place as a fraction of stature; posterior coordinates are negative. `middle`: Forward place of maximum breadth as a fraction of stature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkShapes.IShoulder is the canonical exchange used by AutoMovieHumanTrunkShapes.SHOULDER.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `front`, `back`, `middle`, `squareFront`, `squareBack`; callers supply the complete record.
