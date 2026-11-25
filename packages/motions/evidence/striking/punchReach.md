# src/striking/punchReach.ts#punchReach.IReach

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The step in metres, the shoulder and the elbow's hint as world points, the arm as the reach solution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the punch's footwork and arm read of one solution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the reach solution type.

# src/striking/punchReach.ts#punchReach.ICorrection

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

Changes over the reach before the correction, in metres, on the correction unit's window in film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the punch's footwork, stroke and arm superpose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the tracker's unit window.

# src/striking/punchReach.ts#punchReach.same

## @evidence contracts/development/common.md#meaningful-documentation

States what is compared and how.

## @evidence contracts/development/implementation.md#principled-implementation

A correction that moves nothing leaves the punch as its launch plan put it, bit for bit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conjunction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact comparison: any change counts.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
