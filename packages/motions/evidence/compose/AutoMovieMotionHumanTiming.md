# src/compose/AutoMovieMotionHumanTiming.ts#AutoMovieMotionHumanTiming.transport

## @evidence contracts/development/common.md#meaningful-documentation

States the input's unit and the result's; the namespace gives the formula and its standing.

## @evidence contracts/development/implementation.md#principled-implementation `BASE + RATE D`, a time that grows with distance from a floor of a few tenths of a second; named provisional.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative distance counts as none, since a length cannot be negative; both coefficients are named provisional constants.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One expression with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTiming.ts#AutoMovieMotionHumanTiming.aimed

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and meaning and the result's; the namespace gives the formula and its source.

## @evidence contracts/development/implementation.md#principled-implementation

McIntosh et al. 2018's two-factor model with the group coefficients of its table 1.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over four named constants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fit is not extrapolated below its shortest measured amplitude; a negative width counts as none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One expression with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache; `HumanPrehension.nominal` delegates here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTiming.ts#AutoMovieMotionHumanTiming

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and that the place decides the rule; the namespace states the rule.

## @evidence contracts/development/implementation.md#principled-implementation

A movement that must stop on a solid thing of a known width is an aimed movement; a movement to a free place has no width to be accurate to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition over the two rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A solid place without a width takes the free-space rule instead of an invented width.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `aimed` and `transport`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One condition with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTiming.ts#AutoMovieMotionHumanTiming.seconds

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result's unit and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A pause reads `PAUSES`; a travel takes the aimed rule when it states a width and the free-space rule otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per rung.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a scale past its bound and an unsourced value throw.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `aimed` and `transport`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTiming.ts#AutoMovieMotionHumanTiming.phrase

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and what happens to an absent member.

## @evidence contracts/development/implementation.md#principled-implementation

Each member is its span's seconds; the phrase's structure is unchanged, so the clock reads it as before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No absent member is given a length.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates every member to `seconds`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
