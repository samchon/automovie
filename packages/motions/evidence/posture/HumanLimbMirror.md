# src/posture/HumanLimbMirror.ts#HumanLimbMirror.joint

## @evidence contracts/development/common.md#meaningful-documentation

States what is mirrored for a side's record and for a midline one, and the fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

The mirror of a one-record pose (`HumanArmMirror.mirrored`), so a record mirrored alone is the record `pose` gives it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation on a pose of that one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second statement of the mirror's rule.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanArmMirror.mirrored`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanLimbMirror.ts#HumanLimbMirror.goal

## @evidence contracts/development/common.md#meaningful-documentation

States what is mirrored and why the reference is not.

## @evidence contracts/development/implementation.md#principled-implementation

The median-plane reflection of each of the goal's parts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record, one line per part.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every part a fit reads is mirrored.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per part.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanArmMirror`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
