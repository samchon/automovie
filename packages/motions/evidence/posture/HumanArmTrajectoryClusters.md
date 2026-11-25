# src/posture/HumanArmTrajectoryClusters.ts#HumanArmTrajectoryClusters

## @evidence contracts/development/common.md#meaningful-documentation

States the runs, their spheres and who reads them.

## @evidence contracts/development/implementation.md#principled-implementation

Consecutive corners of one part form a run; the sphere about its corners' mean reaching the farthest one contains every corner, so a screen against it is conservative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass to find a run's end, one for its mean and one for its radius.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every corner belongs to exactly one run, in the corners' order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computed for the frame it is given; nothing else to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the runs are the caller's.

# src/posture/HumanArmTrajectoryClusters.ts#HumanArmTrajectoryClusters.ICluster

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its index range or its unit.

## @evidence contracts/development/design.md#principled-representation

A half-open index range into the frame's corners and the sphere about them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, each read by the screen or the corner loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The run refers to the corners by index; no corner is copied.

# src/posture/HumanArmTrajectoryClusters.ts#HumanArmTrajectoryClusters.reaches

## @evidence contracts/development/common.md#meaningful-documentation

States the screen, its slack and why it is safe.

## @evidence contracts/development/implementation.md#principled-implementation

By the triangle inequality no corner of the run lies nearer the segment's sphere than the run's sphere does, so a run beyond the reach holds no corner within it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The slack is far below the reach and far above a distance's rounding, so no corner in reach is screened out.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
