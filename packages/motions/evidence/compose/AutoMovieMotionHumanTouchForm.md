# src/compose/AutoMovieMotionHumanTouchForm.ts#AutoMovieMotionHumanTouchForm.curled

## @evidence contracts/development/common.md#meaningful-documentation

States what is added, why and the unchanged case.

## @evidence contracts/development/implementation.md#principled-implementation

The curl the stroke displays (`AutoMovieMotionHumanHand.form`) is the curl its effector is read with.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The kind's own curl, never a row's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchForm.ts#AutoMovieMotionHumanTouchForm.period

## @evidence contracts/development/common.md#meaningful-documentation

States both rules, the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A sine of amplitude A and period T peaks at 2 pi A / T, so the period that meets a peak speed is 2 pi A / v.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The amplitude is the body's hand length times the kind's share.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchForm.ts#AutoMovieMotionHumanTouchForm.tangent

## @evidence contracts/development/common.md#meaningful-documentation

States which direction is taken, for which hand, and the fallbacks.

## @evidence contracts/development/implementation.md#principled-implementation

The first candidate whose part across the normal is long enough, normalised; `across` points toward the body's midline from the acting hand, so the body's mirror symmetry carries a stroke from one hand to the other.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two perpendicular candidates and one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate shorter than 0.3 across the normal is skipped so a near-parallel direction is never normalised.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanFrame.point`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
