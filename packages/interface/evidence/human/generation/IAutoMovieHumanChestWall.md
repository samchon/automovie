# src/human/generation/IAutoMovieHumanChestWall.ts#IAutoMovieHumanChestWall

## @evidence contracts/development/common.md#meaningful-documentation

Chest breadth/depth regressions and the skin-template box closed against a requested girth. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IWall, IBoxResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IWall, IBoxResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanChestWall exchanges the named IWall, IBoxResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanChestWall.ts#IAutoMovieHumanChestWall.IWall

## @evidence contracts/development/common.md#meaningful-documentation

One sex's two lines on the girth, `a + b girth`, mm.

## @evidence contracts/development/design.md#principled-representation `depth`: Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of girth. `breadth`: Chest diameter across the rib cage: intercept, mm, and slope per mm of girth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanChestWall.LINES, AutoMovieHumanChestWall.wall.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `depth`, `breadth`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanChestWall.ts#IAutoMovieHumanChestWall.IBoxResult

## @evidence contracts/development/common.md#meaningful-documentation

The chest wall's box at a girth.

## @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanChestWall.IBoxResult is the canonical exchange used by AutoMovieHumanChestWall.box.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`; callers supply the complete record.
