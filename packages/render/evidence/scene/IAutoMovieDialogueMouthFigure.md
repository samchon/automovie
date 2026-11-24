# src/scene/IAutoMovieDialogueMouthFigure.ts#IAutoMovieDialogueMouthFigure

## @evidence contracts/development/common.md#meaningful-documentation

States who calls the figure and when, what a null mouth means, which representations provide one, and what `show` returns.

## @evidence contracts/development/design.md#principled-representation

A figure is the one place that knows which form its representation draws and whether its model can show it, so `show` returns what it drew rather than the caller guessing; the jaw is in millimetres at the incisors and the weights are MPEG-4 viseme weights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One method, called by `AutoMovieDialogueMouthStage` and implemented by `AutoMoviePlayer`, `createAutoMovieHumanPolygonFigure` and figures a production binds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No representation kind is encoded in the type; the shown form is the record's present member.

# src/scene/IAutoMovieDialogueMouthFigure.ts#IAutoMovieDialogueMouthFigure.IShown

## @evidence contracts/development/common.md#meaningful-documentation

States the two forms and when each is present.

## @evidence contracts/development/design.md#principled-representation

The drawn-mouth record's two forms, reused from `IAutoMovieDrawnMouth` without its actor, which the stage adds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by figures and merged into the drawn record by the stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It reuses the owner's member types rather than restating them.
