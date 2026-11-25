# src/posture/HumanFloorReading.ts#HumanFloorReading.IReading

## @evidence contracts/development/design.md#principled-representation

Stores current world-metre bounds, support points, candidate heights and target frames on the same posed bones; ordered index arrays identify their owning collider and bearing part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fit, merit, selected-contact rows and target readers consume these fields; physicalShapeBounds remains the single bounds owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps every collider and candidate, with Infinity for a bearing part that matches no collider; no absent contact or predicted posture is fabricated, and compatible array indices remain producer premises.

## @evidence contracts/development/common.md#meaningful-documentation

Defines current pose, world units, index relationships, absent-part behavior and target/candidate frames.

# src/posture/HumanFloorReading.ts#HumanFloorReading

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

One forward kinematics; each collider's lowest point is its placed shape's bounds, the floor audit's reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the placed colliders.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every collider is read; none is skipped by its height.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds one posture resolution/FK to collider bounds and candidate work, B regex checks per collider for B bearing parts, and T target transforms; hull work still scans its vertices, while duplicate shape-frame composition is removed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A supplied operation reader shares only exact current authored/ancestor FK dependencies through canonical limb/digit resolution and final bone reading. Current bounds/candidates share one fresh shape frame; hull points retain original rotation/translation arithmetic. Shape/pose reads and bearing regex order/effects remain current.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The FK source is borrowed synchronously and never enters the result. Returned arrays and fresh posed snapshots belong to the reading; target points/turns may borrow its resolved bone vectors, which consumers keep unchanged, without module-level query retention.
