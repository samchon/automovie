# src/lexicon/HumanCarriedLean.ts#HumanCarriedLean.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the layer's name and how it is used.

## @evidence contracts/development/implementation.md#principled-implementation

The angle is added to the posture's pitch and the root moved so the planted feet's midpoint stays, a rigid turn of the body about its ankles, the inverted pendulum `HumanLoad.lean` balances; the planted leg goals stay in the world, so the ankles take the pitch and the joints the action holds are kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pivot, one pitch, one root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A carry with no lean still returns a layer that adds nothing, so every carry composes the same way.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Postures are evaluated independently; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer closes over one angle.

# src/lexicon/HumanCarriedLean.ts#HumanCarriedLean.coupled

## @evidence contracts/development/common.md#meaningful-documentation

States when it is used, the input and the layer's name.

## @evidence contracts/development/implementation.md#principled-implementation

The same tip about the feet the standalone bearing applies (`tipped`), so a walked carry balances as a standing one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tip per posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are the caller's balance, never a table's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `tipped`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer closes over two angles.

# src/lexicon/HumanCarriedLean.ts#HumanCarriedLean.tipped

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot, the angles' senses, what stays and the case with no planted leg.

## @evidence contracts/development/implementation.md#principled-implementation

The pivot is read in the posture's own root frame and put back where it was after the angles are added, a rigid turn of the body about that point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pivot, the angles, one root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is clamped; the caller's balance gives it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `humanPostureHeading`; the layer and the coupled bearing tip through it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
