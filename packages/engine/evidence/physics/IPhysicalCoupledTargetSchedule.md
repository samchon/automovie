# src/physics/IPhysicalCoupledTargetSchedule.ts#IPhysicalCoupledTargetSchedule

## @evidence contracts/development/common.md#meaningful-documentation

Keys populated intervals by integer step, with groups ordered by id.

## @evidence contracts/development/design.md#principled-representation

Keeps per-step membership separate from runtime root and pose selection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A producer needs only the groups for its current sampled step.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The borrowed schedule contains no native state or fitted outputs.
