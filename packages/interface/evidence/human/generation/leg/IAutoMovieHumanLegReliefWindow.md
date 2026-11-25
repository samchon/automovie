# src/human/generation/leg/IAutoMovieHumanLegReliefWindow.ts#IAutoMovieHumanLegReliefWindow.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

A window's declaration.

## @evidence contracts/development/design.md#principled-representation `name`: Name, for diagnostics and part ids. `segment`: The bone the window's centre stands on. `share`: Share of that bone at the centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegReliefWindow.create. Also types AutoMovieHumanLegReliefWindows.PATELLA, AutoMovieHumanLegReliefWindows.TIBIAL_TUBEROSITY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `anchor`: Where the centre stands when it is not a share of a bone: `crotch` puts it at the person's gluteal furrow height when that is known and lies inside the leg, else at the leg's first own row under the crotch ring, where the trunk's ring has handed the skin over to the leg's law.

# src/human/generation/leg/IAutoMovieHumanLegReliefWindow.ts#IAutoMovieHumanLegReliefWindow.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a window is placed from.

## @evidence contracts/development/design.md#principled-representation `bones`: The joints' heights, mm. `radius`: The local radius at the window's centre, mm: the section's girth over 2 pi. `at`: The centre's station when the window is anchored (see {@link IWindow.anchor}), mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegReliefWindow.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `at`: The centre's station when the window is anchored (see {@link IWindow.anchor}), mm.
