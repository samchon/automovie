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
