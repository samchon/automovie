# src/compose/AutoMovieMotionHumanVariationForm.ts#AutoMovieMotionHumanVariationForm

## @evidence contracts/development/common.md#meaningful-documentation

States which slots these are, where the shared terms are defined and what the functions leave alone.

## @evidence contracts/development/design.md#principled-representation

The freedoms a hand's goal does not depend on vary with little regard to skill (Scholz and Schoner 1999; Todorov and Jordan 2002), and an amount varies in proportion to its size (Harris and Wolpert 1998).

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function per slot type; `AutoMovieMotionHumanBend` and `AutoMovieMotionHumanRange` keep the elbow's strain and the levels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each result has the type and the unit of its input, so a law passes it on with no conversion.

# src/compose/AutoMovieMotionHumanVariationForm.ts#AutoMovieMotionHumanVariationForm.amount

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread, the three bounds and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

Signal-dependent noise: a larger movement varies more, so the offset is a factor on the share (Harris and Wolpert 1998). Skill and variation never raise a range of motion, so the whole range bounds the result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound and one scalar offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped; a share of 0 or of the whole range has no room and stays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `LEVELS` of `AutoMovieMotionHumanRange` through the shared cell rule and the shared scalar offset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationForm.ts#AutoMovieMotionHumanVariationForm.swivel

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the axis, the spread, the bound and what stays.

## @evidence contracts/development/implementation.md#principled-implementation

The elbow's swivel does not change where the hand is, so it is a freedom the goal does not depend on and varies with little regard to skill (Scholz and Schoner 1999); the allowed arc is read on the same strain `solve` ranks by.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The allowed arc on both sides, one scalar offset and one turn about the line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arc ends at the first place the strain refuses, so an offset never passes through a refused place to an allowed one beyond it; an elbow on the line has no swivel and stays.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most `2 AutoMovieMotionHumanVariationDraw.TRUNCATE spread / STEP` strain reads, each one bounded sweep, once per slot at plan time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanBend.strain` for legality and `AutoMovieMotionHumanBend.turn` for the rotation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationForm.ts#AutoMovieMotionHumanVariationForm.bend

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

The elbow's width is a freedom the hand's goal does not depend on, so its spread narrows little with skill (Scholz and Schoner 1999).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared scalar offset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationForm.ts#AutoMovieMotionHumanVariationForm.curvature

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

How a hand's path bows between two places is a freedom the end place does not depend on, so its spread narrows little with skill (Todorov and Jordan 2002).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared scalar offset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
