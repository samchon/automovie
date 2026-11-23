# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and frame.

## @evidence contracts/development/design.md#principled-representation

The share record beside the point it is on this body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; returned by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the place owner's record.

# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.IShift

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

One share per axis, each of the measure its axis is read against.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members; returned by `shares`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The nudge is given in its own unit, so it is not converted by hand.

# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.IBend

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and origin.

## @evidence contracts/development/design.md#principled-representation

The preset's shares beside the offset from the shoulder they are on this body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; returned by `bend`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the bend owner's record.

# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.IAmount

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

The share of the motion's limit beside the signed degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; returned by `amount`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both are read from the range owner.

# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.IBody

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its role.

## @evidence contracts/development/design.md#principled-representation

The column's label and the measure the column is computed from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `table`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only the measure is asked for, so a capture body and a test stub both fit.

# src/motion/human/compose/IAutoMovieMotionHumanResolve.ts#IAutoMovieMotionHumanResolve.ISwivelBodies

## @evidence contracts/development/common.md#meaningful-documentation

name: Display label for this body's column in the textual swivel comparison. body: Borrowed body geometry and joint constraints used to compute that comparison column.

## @evidence contracts/development/design.md#principled-representation

name: Display label for this body's column in the textual swivel comparison. body: Borrowed body geometry and joint constraints used to compute that comparison column.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.swivel, bodies).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
