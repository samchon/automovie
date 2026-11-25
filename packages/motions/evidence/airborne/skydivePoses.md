# src/airborne/skydivePoses.ts#skydivePoses.IKey

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The key's share of the fall and its pose, which rests its lowest point on the ground.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the landing blends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Provisional and stated as such.

# src/airborne/skydivePoses.ts#skydivePoses.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the mirror.

## @evidence contracts/development/implementation.md#principled-implementation

The pose's tilt and joints with the roll negated for the right side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The joints are the pose's, not mirrored side for side.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
