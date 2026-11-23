# src/production/sound/IAutoMovieDialogueMouths.ts#IAutoMovieDialogueMouths

## @evidence contracts/development/common.md#meaningful-documentation

States who builds it and over what, that reads are recorded and why, how a subject reads one form per actor and layers it, and each method's unit and silent value.

## @evidence contracts/development/design.md#principled-representation

Two reads by actor and film second, one per mouth form, so the record knows which form drove a figure; seconds are the subject's own timebase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract because the draw page in render builds it and a production's film, which declares its figures, consumes it through `IAutoMovieDrawScene.speak`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No figure kind or actor list is declared; the subject decides which form each actor takes.
