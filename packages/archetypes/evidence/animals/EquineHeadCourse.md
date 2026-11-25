# src/animals/EquineHeadCourse.ts#EquineHeadCourse.IObstacle

## @evidence contracts/development/common.md#meaningful-documentation

Metres in the moving animal's model space.

## @evidence contracts/development/design.md#principled-representation

Two ends and a radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a course is checked against.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineHeadCourse.ts#EquineHeadCourse.IRadii

## @evidence contracts/development/common.md#meaningful-documentation

Metres.

## @evidence contracts/development/design.md#principled-representation

Two radii.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The moving bars' thickness.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineHeadCourse.ts#EquineHeadCourse.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States what a direct course is.

## @evidence contracts/development/design.md#principled-representation

A via turn and whether it is used.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `plan`, read by `shown`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineHeadCourse.ts#EquineHeadCourse.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Test the direct path, then each dip in order, at `CHECKS` shares by exact segment distances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One candidate loop and one clearance test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A course that only clears by tolerance at its end, where it touches, is the only allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C × CHECKS × O) for C candidates and O obstacle bars.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the head channel's carriage.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh course.

# src/animals/EquineHeadCourse.ts#EquineHeadCourse.shown

## @evidence contracts/development/common.md#meaningful-documentation

States the two forms.

## @evidence contracts/development/implementation.md#principled-implementation

A direct course slerps each bar from start to goal; a dipped one slerps to the dip over the first half and on to the goal over the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same shown turns the plan was checked on.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineHeadCourse.ts#EquineHeadCourse.rest

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Two unit quaternions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A course's start from rest.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
