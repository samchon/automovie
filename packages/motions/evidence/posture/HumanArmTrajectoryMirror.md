# src/posture/HumanArmTrajectoryMirror.ts#HumanArmTrajectoryMirror.leftFirst

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and why exactly one of a mirrored pair is solved.

## @evidence contracts/development/implementation.md#principled-implementation

A canonical representative of the two-element orbit of the mirror is chosen by the first arm's side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No side is preferred by a tolerance or a result.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryMirror.ts#HumanArmTrajectoryMirror.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States why every side named is swapped.

## @evidence contracts/development/implementation.md#principled-implementation

The mirror takes each side's name to the other's (`mirrored`), so the inverse of a mirrored reading's names is the same swap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One swap over the reason and the fix.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every other member is kept; the value, the axis and the feasible set name no side.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryMirror.ts#HumanArmTrajectoryMirror.mirrored

## @evidence contracts/development/common.md#meaningful-documentation

States what is mirrored.

## @evidence contracts/development/implementation.md#principled-implementation

The reflection across x = 0 of points and the conjugate reflection of rotations (`HumanArmMirror`), with every bone name taken to its opposite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bases, then each arm's side, sites and rests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every member that names a side or a place is mirrored; the clinical triples read the same on either side and stay.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the waypoints: each base and site is mirrored once, a material base when it is read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each record is mirrored once per problem; nothing else is shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned problem.
