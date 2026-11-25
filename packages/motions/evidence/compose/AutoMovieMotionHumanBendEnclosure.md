# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the order of the ends.

## @evidence contracts/development/design.md#principled-representation

An ordered pair of degrees, the form every enclosure and reader shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two numbers and nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sentinel ends: an uncertified enclosure is null at its reader.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.at

## @evidence contracts/development/common.md#meaningful-documentation

States the input's unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation `a + b cos θ + c sin θ`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one evaluation every enclosure and premise check reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.middle

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The sinusoid's closed-form range, then the increasing `asin`, widened by the slack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One range, one refusal, two `asin`s.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A range reaching the poles is refused, never clamped into an answer.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the shoulder's and the wrist's middle angles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.outer

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The angle at the middle and the Lipschitz spread `w M / r`, widened by the slack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluation, one slope, one refusal, one spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A vector that may vanish is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the shoulder's, the wrist's and the forearm's outer angles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.circular

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The angle's offset from the interval's start reduced to one turn, against the interval's width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reduction, one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A full turn is distance 0.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by the shoulder's distance from its neutral.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.excess

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The excess is convex and piecewise linear, least at the reserved interval's middle, so on each shift it is least at the shift's point nearest that middle; the shift nearest it and its two neighbours hold the least.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three shifts, one clamp each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A full turn or more is excess 0.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by the forearm's and the wrist's excesses.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBendEnclosure.ts#AutoMovieMotionHumanBendEnclosure.range

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation `a + R cos(θ − φ)`: the extremes where `φ` or `φ + 180` lies in the interval, the ends otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ends, two containment tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `middle`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
