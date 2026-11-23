# src/compose/AutoMovieMotionHumanTouchUpright.ts#AutoMovieMotionHumanTouchUpright.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the choice and the tie; the namespace states the candidates.

## @evidence contracts/development/implementation.md#principled-implementation

Every candidate is solved by the resolver and the reached hand's tilt decides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop of goal, solve and compare.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every candidate that could still win is solved; head on is tried first, so a tie keeps it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per candidate, at most thirteen per call: a tilt is never below 0, so the search stops at the first facing that holds the vessel exactly upright, a bound that returns what the whole search would.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One fixed body/side observation reader shares genuine FK/ROM metadata through the actual facing loop; tilt retains every distinct raw goal and actual fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous facing search releases its reader on return or throw; the returned facing/lean/tilt holds only original numeric payloads and no workspace or pose history.

# src/compose/AutoMovieMotionHumanTouchUpright.ts#AutoMovieMotionHumanTouchUpright.tip

## @evidence contracts/development/common.md#meaningful-documentation

States the axis, the sense and the case of no turn.

## @evidence contracts/development/implementation.md#principled-implementation

A lean toward the face is a turn about the horizontal line across the way the region faces, which keeps the vessel's turn about its own axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One level direction, one cross product and one turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A normal with no level part gives no turn instead of normalizing a zero vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `AutoMovieMotionHumanTouchLaid.lie`, the touch stroke's held rotation and `AutoMovieMotionHumanTouchDrink.held`, so a laid and a held vessel lean alike.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchUpright.ts#AutoMovieMotionHumanTouchUpright.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what is measured.

## @evidence contracts/development/implementation.md#principled-implementation

The asked rotation lays the effector's along axis on the world's up, so that axis at rest is the up turned back by it; the tilt is how far the rotation the resolver reaches carries it off the up.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal and one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reached rotation is the resolver's, within the joints' ranges, never the asked one.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses rest and the actual drinking-arm observation; solve may lend its genuine same-body fixed-side reader across candidate calls while each current goal still receives its own native fit. Omitted preparation keeps the original cold read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchUpright.ts#AutoMovieMotionHumanTouchUpright.facings

## @evidence contracts/development/common.md#meaningful-documentation

States the candidates, their span and their order.

## @evidence contracts/development/implementation.md#principled-implementation

A turn about the world's up of the level normal, by the step either way; a mirror across the sagittal plane reverses a turn about the up axis, so the left hand's first turn is the reverse of the right's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller passes a level part it has checked is not zero.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `solve` and by the drinking search (`AutoMovieMotionHumanTouchDrink`).

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
