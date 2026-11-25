# src/posture/turnHumanPosture.ts#turnHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States what goes round, what is kept, why the rotation stays a quaternion and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One rigid motion `p -> a + T (p - a)` applied to every world place of the posture and `R -> T R` to every world rotation, so the resolved body is the unturned body turned rigidly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One root and one pass over the four limbs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A planted world goal is refused, never silently turned off its plant; only a rotation that keeps planted goals leaves them in the world, unturned, for their limbs to be re-solved onto.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one heading and at most four goals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the posture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
