# src/physics/physicalPushRecovery.ts#physicalPushRecovery

## @evidence contracts/development/common.md#meaningful-documentation

States which IHMC release the module is, what it decides and places, that no operation writes its input and how a body of more than two feet reuses the rule.

## @evidence contracts/development/design.md#principled-representation

The reference module's operations over its state, with its three constants in metres, seconds and the reference's updates, the safe window's time kept over the caller's reference period (`physicalGlitchFilter.ticks`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the balance phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members in the state; no casts.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents each flag.

## @evidence contracts/development/design.md#principled-representation

The reference's `recovering`, `recoveringFromDoubleSupportFall`, `isRobotBackToSafeState` and `isICPErrorTooLarge`, plain data for a checkpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept in the recovery state by the balance phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.IRegion

## @evidence contracts/development/common.md#meaningful-documentation

Documents each input of the capture region with its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The capture region's inputs but the time, which the operations vary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `preferredSwingTime` and `checkAndUpdate`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.initial

## @evidence contracts/development/common.md#meaningful-documentation

States the initial flags.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's constructor and `reset` (l.101, l.294-301).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.doubleSupport

## @evidence contracts/development/common.md#meaningful-documentation

States the fall condition, the swing choice, the tie and the safe count.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `updateForDoubleSupport` (l.137-183): a fall when the capture point is outside the support polygon and more than 0.05 m from its plan; the foot whose outline's centroid is nearer stays, the left first on a tie, and the other swings. Distances are frame-invariant, so any one horizontal frame serves for the reference's mid-feet and sole frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two conditions, then the nearest foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the support polygon's vertices and the feet.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.singleSupport

## @evidence contracts/development/common.md#meaningful-documentation

States the error test.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `updateForSingleSupport` (l.185-195).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.fall

## @evidence contracts/development/common.md#meaningful-documentation

States when it applies.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `initializeParametersForDoubleSupportPushRecovery` (l.132-135).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.reset

## @evidence contracts/development/common.md#meaningful-documentation

States what is cleared.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `reset` (l.294-301), called when single support ends and when standing or a transfer begins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.preferredSwingTime

## @evidence contracts/development/common.md#meaningful-documentation

States the reduction by tenths, the one-update case and the negative result.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `computePreferredSwingTimeForRecovering` (l.197-220): an empty region's area is not a number (Euclid), so the loop stops at the first time with a region. The reference's first region before the early return only sets the calculator's state, which this module does not keep.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The early return and the loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most twelve capture regions.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The times differ by construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalPushRecovery.ts#physicalPushRecovery.checkAndUpdate

## @evidence contracts/development/common.md#meaningful-documentation

States the guards, the single projection, the not-a-number time and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `checkAndUpdateFootstep` (l.231-281): the region at the preferred time; with a small error the robot counts toward safe; nothing within 0.1 s of touchdown or once recovering; otherwise `physicalFootstepAdjustor`, and a move sets recovering and clears safe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The time, the region, the three guards and the adjustment, in the reference's order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions.

## @evidence contracts/development/implementation.md#efficient-algorithms

The preferred time's regions plus one.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
