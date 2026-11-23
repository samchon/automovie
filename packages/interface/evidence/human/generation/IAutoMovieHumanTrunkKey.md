# src/human/generation/IAutoMovieHumanTrunkKey.ts#IAutoMovieHumanTrunkKey

## @evidence contracts/development/common.md#meaningful-documentation

The trunk column's measures at one landmark station: a key the column's splines run through (`AutoMovieHumanTrunkColumn`).

## @evidence contracts/development/design.md#principled-representation `y`: Height, mm. `width`: Half width at the widest point. `middle`: Forward place of the widest point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkKeys.keys, AutoMovieHumanTrunkShapes.key. Read by AutoMovieHumanTrunkColumn.create, AutoMovieHumanTrunkProfileBack.create, AutoMovieHumanTrunkProfileFront.create. Also types AutoMovieHumanTrunkColumn.used, AutoMovieHumanTrunkKeys.target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `width`, `middle`, `front`, `back`, `squareFront`, `squareBack`, `anterior`; callers supply the complete record.
