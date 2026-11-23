# src/handling/HumanPocket.ts#HumanPocket.mount

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the region frame the body declares and places the prop at its point in the bone's frame, upright with its front against the region, so the hand that slides it in keeps its wrist as it holds it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No offset is tuned; the body's own region decides it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanPocket.ts#HumanPocket.stow

## @evidence contracts/development/common.md#meaningful-documentation

States the start state.

## @evidence contracts/development/implementation.md#principled-implementation

Sets the prop's existing `worn` record to the site's mount.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The performance's worn mount carries it; nothing is simulated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record.

# src/handling/HumanPocket.ts#HumanPocket.takeOut

## @evidence contracts/development/common.md#meaningful-documentation

States the custody change.

## @evidence contracts/development/implementation.md#principled-implementation

The shipped pickup takes a worn prop off its bone at grip closure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One append.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pickup fits and refuses the grasp.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One append.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call appends to its own chain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanPocket.ts#HumanPocket.putBack

## @evidence contracts/development/common.md#meaningful-documentation

States the custody change.

## @evidence contracts/development/implementation.md#principled-implementation

The shipped put-down onto a bone wears the prop there from its release.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One append.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The put-down plans and refuses the placement.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One append.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call appends to its own chain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
