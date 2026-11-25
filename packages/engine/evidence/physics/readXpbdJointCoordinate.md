# src/physics/readXpbdJointCoordinate.ts#readXpbdJointCoordinate

## @evidence contracts/development/common.md#meaningful-documentation

States which coordinate is read and the gated case.

## @evidence contracts/development/implementation.md#principled-implementation

The coordinate the joint's admission clamps (projectPhysicalJointRotation): the chart's angle, or the twist coordinate 2 atan(q.axis / w); MuJoCo's and Bullet's limit rows compare such a coordinate with its range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per joint form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A gated joint has no coordinate per axis and answers none.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chart reading at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one joint at one configuration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; retains nothing.
