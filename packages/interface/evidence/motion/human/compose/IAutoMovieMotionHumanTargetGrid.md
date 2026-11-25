# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.INudge

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the unit and the bound; each member states its direction and its value when absent.

## @evidence contracts/development/design.md#principled-representation

One unit for all three components, so an author reads one number against one length; `out` mirrors by the acting side as the lateral names do.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three optional components; read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounded, so a nudge cannot stand in for a raw place; the frame never follows the trunk's pitch or roll.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.Place

## @evidence contracts/development/common.md#meaningful-documentation

States the three rungs.

## @evidence contracts/development/design.md#principled-representation

Intent first and geometry on demand: every rung resolves to one `IAutoMovieMotionHumanTarget.IDefault`, so the primitives and the verdicts read the same record whichever rung a law writes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One union of five members; read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union and not a construction kit: the rungs do not nest.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.IGrid

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member states its axis and the facing's value when absent.

## @evidence contracts/development/design.md#principled-representation

One name per axis of the performer's floor frame, so a reader sees where the hand is without working out a share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three required names and the facing `IAutoMovieMotionHumanTarget.IDefault` already has; read by `place` and returned by `nearest`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three names are required, so no axis falls back to a hidden number.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.Height

## @evidence contracts/development/common.md#meaningful-documentation

States that each name is a height of the measure; `height` gives each one's value.

## @evidence contracts/development/design.md#principled-representation

A closed union of the landmarks a person places a hand by, so a law states a height the body supplies and types no number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ten names in rising order; `overhead` entered with its first users, the `raiseHand` and `cheer` gestures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No name carries a number of its own apart from `OVERHEAD`; a height between two names is the between rung of `Place`.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.Lateral

## @evidence contracts/development/common.md#meaningful-documentation

States the axis and that it mirrors by the acting side; `LATERALS` gives each share.

## @evidence contracts/development/design.md#principled-representation

A closed union over the half shoulder width, the measure a sideways hand place is read against.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four names, each with a shipped law that uses its share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A side of the body is never named: the same name serves both hands and `place` mirrors it.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.Distance

## @evidence contracts/development/common.md#meaningful-documentation

States the axis; `DISTANCES` gives each share.

## @evidence contracts/development/design.md#principled-representation

A closed union over the arm's length, the measure a reach is read against.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four names, each with a shipped law that uses its share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No name lies past the arm's length, so a named place is always within reach of a standing body.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.INudged

## @evidence contracts/development/common.md#meaningful-documentation

States the two members.

## @evidence contracts/development/design.md#principled-representation

The middle rung of a place: the name keeps the intent and the nudge states the correction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The base is a name, never a share record, so a nudge is always read against a named place.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.IBetween

## @evidence contracts/development/common.md#meaningful-documentation

States the interpolation; each member states its range and its value when absent.

## @evidence contracts/development/design.md#principled-representation

The middle rung for a place no name states: both ends stay named and one share says how far between them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ends, a share and an optional nudge, which a stroke that moves about a place between two names needs; read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ends are names, never share records, and must face the same way.

# src/motion/human/compose/IAutoMovieMotionHumanTargetGrid.ts#IAutoMovieMotionHumanTargetGrid.IExplicit

## @evidence contracts/development/common.md#meaningful-documentation

States the record and what a source is.

## @evidence contracts/development/design.md#principled-representation

The last rung of a place: the exact record the layer uses, for a place no name and no nudge states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The source is required by the type and refused when empty, so no unexplained number enters a law by this rung.
