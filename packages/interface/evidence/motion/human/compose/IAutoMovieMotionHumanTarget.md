# src/motion/human/compose/IAutoMovieMotionHumanTarget.ts#IAutoMovieMotionHumanTarget.IDefault

## @evidence contracts/development/common.md#meaningful-documentation

States the frame; each member gives its unit, its sign and its value when absent.

## @evidence contracts/development/design.md#principled-representation

A height in statures, a distance in arm lengths and a sideways offset in half shoulder widths, so the same record puts a short and a tall performer's hand where they would each hold it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, the least that places and faces a point ahead of a body; read by `fallback`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares of the body's measure, never metres; the facing is a closed union of the two cases the actions have.

# src/motion/human/compose/IAutoMovieMotionHumanTarget.ts#IAutoMovieMotionHumanTarget.Name

## @evidence contracts/development/common.md#meaningful-documentation

States what the names are.

## @evidence contracts/development/design.md#principled-representation

Derived from the table's keys, so a name without a record cannot be written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One alias, read by `Place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Not a second list beside the table.

# src/motion/human/compose/IAutoMovieMotionHumanTarget.ts#IAutoMovieMotionHumanTarget.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its frame, unit and meaning when absent.

## @evidence contracts/development/design.md#principled-representation

A point and the outward normal of the surface there, the frame a contact is made on, with whether a real thing is there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members; `width` is optional because only some solid things state one, and the timing owner reads exactly this pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target's kind is not carried, so no law can branch on it.

# src/motion/human/compose/IAutoMovieMotionHumanTarget.ts#IAutoMovieMotionHumanTarget.IHand

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its default.

## @evidence contracts/development/design.md#principled-representation

What a place does not decide about a hand on it: the surface laid on it, the shape, where the fingers point and how the elbow bends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all optional because each has a default every targetless action can take; read by `hand`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the hand's surface and shape unions and the bend presets.
