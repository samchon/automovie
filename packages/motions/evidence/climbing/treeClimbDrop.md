# src/climbing/treeClimbDrop.ts#treeClimbDrop

## @evidence contracts/development/common.md#meaningful-documentation

States the fall, the touchdown, the absorb and how the feet stay put.

## @evidence contracts/development/implementation.md#principled-implementation

The free fall is closed form from the hang's displayed toes; the absorb eases from the touchdown posture to the stand on the landed feet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the hang, time the fall, then one posture writer over the three phases with the events and contacts rescaled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The landing is the stand's own posture; the absorb's constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two resolves at plan time; constant work per sample past the hang.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the hang's posture and the landing's constants.
