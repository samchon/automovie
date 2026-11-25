# src/human/generation/foot/IAutoMovieHumanFootGuide.ts#IAutoMovieHumanFootGuide.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

A guide: its kept knots' stations and places, and their spline's jets.

## @evidence contracts/development/design.md#principled-representation `stations`: Strictly increasing stations of the kept knots. `values`: Each kept knot's `[across, up]` in its plane, mm. `slopes`: The spline's first derivatives at the knots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootGuide.of. Read by AutoMovieHumanFootGuide.at, AutoMovieHumanFootGuide.tangent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `values`, `slopes`, `curvatures`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootGuide.ts#IAutoMovieHumanFootGuide.IFanKnot

## @evidence contracts/development/common.md#meaningful-documentation

A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn).

## @evidence contracts/development/design.md#principled-representation

A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn). The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootGuide.fanned. Also types AutoMovieHumanFootColumn.KNOTS, AutoMovieHumanFootKnots.FANNED.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootColumn.KNOTS, AutoMovieHumanFootColumn.knots, AutoMovieHumanFootColumn.law, AutoMovieHumanFootGuide.fanned for a knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn).
