# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain

## @evidence contracts/development/common.md#meaningful-documentation

States each input and what the returned function reads.

## @evidence contracts/development/implementation.md#principled-implementation

A joint-range-normalised discomfort (Cruse 1986; Kee and Karwowski 2001): each angle's distance from the hanging arm's over half its range, squared, with the turn the hand asks split between the forearm's twist and the wrist's swing (the engine's `swingTwist`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ranges once, then one function of the two readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A turn the forearm and the wrist cannot make ranks behind every turn they make (`UNMADE`), never as a smaller strain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ranges and the hand constraint are read once per scoring factory; each actual place retains its original squares, split and decomposition. Pure angle/range readers are module functions rather than three closures allocated per candidate; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The engine owns decomposition, split and constraint lookup. All candidates use the same pure scalar readers with their actual current quaternions/ranges; no angle, strain or legality answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the chain's ranges and the hanging arm's angles.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.least

## @evidence contracts/development/common.md#meaningful-documentation

States what is bounded, from what, and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The strain is the shoulder's share plus the hand's non-negative shares, or `UNMADE` plus a positive excess; the shoulder's share, computed with the same terms in the same order, is at most the first (adding non-negative doubles never lowers a sum under rounding to nearest), and its minimum with `UNMADE` is at most the second, so it bounds both from below.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ranges once, then the shoulder's three squares and one minimum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound is never ranked as the strain: the comparator reads the exact strain wherever the bound leaves a comparison open.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three squares per place, against the hand's split and decomposition it defers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `share` and the ranges' halves with `of`, so the shoulder's share is the same number in both.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the ranges' halves and the hanging arm's angles.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.IHand

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and its absent case.

## @evidence contracts/development/design.md#principled-representation

The rig's own constraint and axes of the hand bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by `of` and the unmade bound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The members are read, never defaulted.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.handOf

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's resolved constraint of the hand bone and the chain's axes for it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one read `of` and the unmade bound share, so both judge the same wrist.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.IHalves

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the order and the null case.

## @evidence contracts/development/design.md#principled-representation

The three denominators the shoulder's share divides by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A fixed triple read by `of`, `least` and the swivel-interval bound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed axis is null, never a zero that would divide.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.halvesOf

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

Half of `max - min` per axis, the normalisation of Kee and Karwowski's joint-range discomfort.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three readings of one helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty or inverted interval is a fixed axis.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one formula `of`, `least` and the swivel-interval bound divide by, so their shares are the same numbers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendStrain.ts#AutoMovieMotionHumanBendStrain.share

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their units and the fixed-axis case.

## @evidence contracts/development/implementation.md#principled-implementation `(value / of)^2`, Kee and Karwowski's normalised discomfort term.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A fixed axis adds nothing rather than dividing by zero.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one term `of`, `least` and the swivel-interval bound sum.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
