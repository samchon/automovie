# src/human/generation/leg/IAutoMovieHumanLegReliefWindow.ts#IAutoMovieHumanLegReliefWindow

## @evidence contracts/development/common.md#meaningful-documentation

Describes anatomical relief-window locations with local-radius dimensions and optional crotch anchoring; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Anatomical relief-window locations with local-radius dimensions and optional crotch anchoring. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanLegReliefWindow; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing LegReliefWindow contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
