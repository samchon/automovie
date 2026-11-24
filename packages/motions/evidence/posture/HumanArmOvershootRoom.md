# src/posture/HumanArmOvershootRoom.ts#HumanArmOvershootRoom.IShape

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

A collider shape, its segment's frame and its two roles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the reading reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the collider and framing records.

# src/posture/HumanArmOvershootRoom.ts#HumanArmOvershootRoom.IRoom

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and frame.

## @evidence contracts/development/design.md#principled-representation

The chest's plane, the other arm's presence and the framed shapes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the reading reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the collider record and `IShape`.

# src/posture/HumanArmOvershootRoom.ts#HumanArmOvershootRoom

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, per what, and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The chest's own frame gives the median plane's outward axis; every shape is framed once by its owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One build from the three lists and the side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every shape of every list is kept with its role.

## @evidence contracts/development/implementation.md#efficient-algorithms

Built once by the sweep's preparation (`HumanArmOvershoot.prepare`); every candidate of the sweep reads it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The lists are the same records across a sweep's candidates, so the prepared room serves them all.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned by the prepared reader and released with it; nothing is kept between sweeps.
