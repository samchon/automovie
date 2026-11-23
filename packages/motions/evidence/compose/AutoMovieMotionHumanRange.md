# src/compose/AutoMovieMotionHumanRange.ts#AutoMovieMotionHumanRange.share

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result's range and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The level's share times the scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a scale past its bound throws and names the neighbouring level.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRange.ts#AutoMovieMotionHumanRange.degrees

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result's sign and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The share times the motion's limit in `DEFAULT_HUMANOID_ROM`, measured from the joint's rest at 0; explicit degrees take the limit's sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One limit lookup, then one branch per rung.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a locked axis and degrees past the limit throw.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the engine's range table and delegates the share to `share`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRange.ts#AutoMovieMotionHumanRange.limit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result's sign and what null means.

## @evidence contracts/development/implementation.md#principled-implementation

The end of the motion's axis in `DEFAULT_HUMANOID_ROM`, as the namespace's table maps motions to limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis choice and one end choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A motion with no room reads as null, never as 0 degrees.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the engine's range table; `degrees` and the resolve table both read limits here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRange.ts#AutoMovieMotionHumanRange.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the limit the share is of, and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk's lean is a root pitch and roll and not one joint, so its range is the limit the reach leans to, `AutoMovieMotionHumanReach.LEAN_LIMIT`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per rung.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the reach's limit and `share`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRange.ts#AutoMovieMotionHumanRange.shift

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result's unit.

## @evidence contracts/development/implementation.md#principled-implementation

A small whole-body displacement scales with the body's height, so the same share is the same movement on a short and a tall body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No metres are typed by the caller.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One product with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
