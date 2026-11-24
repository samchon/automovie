# src/physics/physicalBalanceTouchdown.ts#physicalBalanceTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

States which phases share the writes.

## @evidence contracts/development/design.md#principled-representation

A namespace of the landing, timeout and failure writes on a state the caller owns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by physicalBipedTouchdown and physicalQuadTouchdown.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Functions only.

# src/physics/physicalBalanceTouchdown.ts#physicalBalanceTouchdown.land

## @evidence contracts/development/common.md#meaningful-documentation

States what a landing writes, the seat's caller-given shares and why no other foot is re-latched.

## @evidence contracts/development/implementation.md#principled-implementation

The biped's and the quadruped's landing: the landed foot's offset and the root's from the authored poses, the landing's record, the foot seated with zero error where it stands, and its step resolved. The seat's initial shares are the caller's; both of IHMC 201903's controllers start a landed foot as a full contact (`TransferToStandingState` l.79, `QuadrupedSupportState.onEntry` l.74-84).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One assignment per written field, in the order the records read them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cast types the null-prototype copy of the offsets; non-null assertions read the root target and the offset just written.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per landing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It writes one landing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the landing record grows by one entry, owned by the caller's state.

# src/physics/physicalBalanceTouchdown.ts#physicalBalanceTouchdown.overdue

## @evidence contracts/development/common.md#meaningful-documentation

States the timeout and its default.

## @evidence contracts/development/implementation.md#principled-implementation

The policy's landing timeout past the swing's end, the product's own policy input.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one swing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBalanceTouchdown.ts#physicalBalanceTouchdown.fail

## @evidence contracts/development/common.md#meaningful-documentation

States what a failed landing writes and why.

## @evidence contracts/development/implementation.md#principled-implementation

A timed-out landing withdraws the support rather than inventing a success: every step under way is resolved as failed and the failure recorded for the settle phase's exhaustion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The resolutions, the trace, then the state's fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution per step under way.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It writes one failure.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.