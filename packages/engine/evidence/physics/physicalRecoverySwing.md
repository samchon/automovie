# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing

## @evidence contracts/development/common.md#meaningful-documentation

States which steps are under way and in which order.

## @evidence contracts/development/implementation.md#principled-implementation

The steps under way of any number of limbs, in the order they lifted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the legs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.of

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns for a limb.

## @evidence contracts/development/implementation.md#principled-implementation

The step under way whose limb it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps under way.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.lifted

## @evidence contracts/development/common.md#meaningful-documentation

States which limbs it returns and in which order.

## @evidence contracts/development/implementation.md#principled-implementation

A step under way is lifted once its seat is given up, as its step begins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps under way.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.requested

## @evidence contracts/development/common.md#meaningful-documentation

States which limbs it returns and in which order.

## @evidence contracts/development/implementation.md#principled-implementation

A step under way whose limb keeps its seat; the plans lift a limb as its step begins, so none is left but a recorded state's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps under way.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.retime

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, what is kept and that the input is unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The start moves to the given moment and the end with it, the duration kept: a request is timed from now until it lifts and from its lift-off then.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.record

## @evidence contracts/development/common.md#meaningful-documentation

States which record it finds and what it returns without one.

## @evidence contracts/development/implementation.md#principled-implementation

A limb's step under way is its latest unresolved record, since a limb has at most one step under way.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One backward scan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read indices inside the list's bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the records, from the latest, which is usually the first checked.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRecoverySwing.ts#physicalRecoverySwing.resolve

## @evidence contracts/development/common.md#meaningful-documentation

States which record is resolved, with what, and what it returns without one.

## @evidence contracts/development/implementation.md#principled-implementation

The limb's step under way (`record`) is marked with when and how it ended, kept for replay, audio and support audits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one copy of the list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
