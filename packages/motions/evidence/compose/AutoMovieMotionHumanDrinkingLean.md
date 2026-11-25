# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.IMisses

## @evidence contracts/development/common.md#meaningful-documentation

Each member states when it is called and what it gives.

## @evidence contracts/development/design.md#principled-representation

One number per attempt: the least miss among the arms that drink.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members: the attempt begins and shows its arms, the walk reads the miss.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing of an earlier attempt is kept past the next one's start.

# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.IMisses.begin

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `misses`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.IMisses.see

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `misses`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.IMisses.least

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `misses`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `misses`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.misses

## @evidence contracts/development/common.md#meaningful-documentation

States the result; the interface states each member.

## @evidence contracts/development/implementation.md#principled-implementation

Only an arm that drinks counts: one outside the shoulder's range is not refused for the hand's turn, so its miss says nothing of the lean.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kept number and three closures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One number, released with the search that made the reader.

# src/compose/AutoMovieMotionHumanDrinkingLean.ts#AutoMovieMotionHumanDrinkingLean.least

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the assumption, the closed form with its measurement and each argument.

## @evidence contracts/development/implementation.md#principled-implementation

The miss of a hand at a joint's end is linear in the lean with slope minus one, so its zero is read from one attempt; the grid's leans about it are attempted, never assumed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coarse loop with the closed-form window on a miss and the fine bracket on an admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every returned lean was attempted and admitted; the zero is read only where two coarse leans in a row agree on it, so a miss that does not fall with the lean (an unsigned miss of a hand below the asked lean rises with it) opens no window.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most seven coarse attempts, three in each agreed window and two fine ones; a held glass admitted near 70 degrees is found after the second coarse lean whose arm drinks, where the walk tried every coarse lean and found none; a hand no lean admits costs the coarse attempts alone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No lean is attempted twice within one walk; nothing is kept beyond it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The set of tried leans, at most nineteen numbers, ends with the call.
