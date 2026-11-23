# src/cover/coverWall.ts#coverWall.IFace

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

The face's centre at floor height, its outward normal and its length axis, both horizontal unit vectors, and its half length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four values the cover moves read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by read.

# src/cover/coverWall.ts#coverWall.read

## @evidence contracts/development/common.md#meaningful-documentation

States the result and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the prop's +Z and +X into the world, flattened to the floor, and takes the affordance's width as the face length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, then one frame transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a prop it cannot read rather than assuming a face.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the prop's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/cover/coverWall.ts#coverWall.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

One refusal kind for a cover geometry that does not fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names the actual parameter and value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
