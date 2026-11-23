# src/kinematics/skeletonJointAxes.ts#skeletonJointAxes

## @evidence contracts/development/implementation.md#principled-implementation

A precedence merge of two partial maps keyed by bone, where the bone's own declaration overrides the host table because it describes the bone's actual rest frame; it premises unique bone names, which validateModel admits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the precedence rule, called at each engine entry that receives both a skeleton and a table, so no caller repeats the lookup order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone or rig is special-cased; a skeleton without declarations returns the host table unchanged, which keeps every existing result identical.

## @evidence contracts/development/common.md#meaningful-documentation

States the precedence, the fallback to the default basis, the identity and empty returns and their ownership, and where the declared axes are validated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the bones; a copy of the table is made only when a bone declares axes, linear in the table and bone counts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its two arguments; callers that resolve many poses of one rig can hold the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned table borrows the declared axis records.
