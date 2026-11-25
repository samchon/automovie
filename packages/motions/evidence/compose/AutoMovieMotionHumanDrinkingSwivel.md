# src/compose/AutoMovieMotionHumanDrinkingSwivel.ts#AutoMovieMotionHumanDrinkingSwivel.bounded

## @evidence contracts/development/common.md#meaningful-documentation

States the circle, why each bound is a sinusoid, the choice and the cases that keep the hint.

## @evidence contracts/development/implementation.md#principled-implementation

The range constrains the hint the arm is fitted with, in the source's own measure, solved in closed form on the swivel circle: the hint inside it is kept, one outside it moves to the nearest end of its refused arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The trunk once, the four bounds once; per hint one call of the shared bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sweep and no sampling beyond the exact three-point fit; a wrist out of the arm's reach and a fully refused circle keep the hint for the admission to judge.

## @evidence contracts/development/implementation.md#efficient-algorithms

One actual limb-free canonical solve and ordered joint admission request only shoulder/elbow/wrist/hip FK ancestry/output, then constant work per hint. Proven unrelated digit fits may be omitted by the shared selector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The canonical observation and final FK share one exact local reader; all numerical projection/fit work remains actual. The closed-form bound and drinking measure retain their existing owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and four-name demand end when preparation returns/throws; the returned function retains only the original numerical arm/bounds, without poses, body history or the reader.

# src/compose/AutoMovieMotionHumanDrinkingSwivel.ts#AutoMovieMotionHumanDrinkingSwivel.IRanged

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it reads.

## @evidence contracts/development/design.md#principled-representation

Two readers of one arm and one set of bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by the drink's pool.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both read the same bounds, built once.

# src/compose/AutoMovieMotionHumanDrinkingSwivel.ts#AutoMovieMotionHumanDrinkingSwivel.IRanged.hint

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `ranged`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanDrinkingSwivel.ts#AutoMovieMotionHumanDrinkingSwivel.IRanged.admits

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `ranged`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `ranged`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanDrinkingSwivel.ts#AutoMovieMotionHumanDrinkingSwivel.ranged

## @evidence contracts/development/common.md#meaningful-documentation

States what is built once and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The bounds are `bounded`'s; the admission is their exact union on the wrist's circle (`AutoMovieMotionHumanSwivelBound.admits`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The trunk, the four bounds, two readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sweep and no sampling.

## @evidence contracts/development/implementation.md#efficient-algorithms

One limb-free canonical solve, then constant work per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both readers share the one solve and bounds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readers retain the arm and the bounds only.
