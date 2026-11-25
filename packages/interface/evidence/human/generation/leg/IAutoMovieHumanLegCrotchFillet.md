# src/human/generation/leg/IAutoMovieHumanLegCrotchFillet.ts#IAutoMovieHumanLegCrotchFillet.ILoop

## @evidence contracts/development/common.md#meaningful-documentation

The leg's start ring at the leg's phases.

## @evidence contracts/development/design.md#principled-representation `points`: Points of the loop at the leg's phases. `normals`: Outward horizontal normals there. `rates`: The trunk's station derivative at each point, per mm up.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegCrotchFillet.of. Also types AutoMovieHumanLegCrotchFillet.out, AutoMovieHumanLegCrotchRoot.loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `normals`, `rates`, `seconds`, `edges`; callers supply the complete record.
