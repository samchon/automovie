# src/physics/IPhysicalCoupledTargetRun.ts#IPhysicalCoupledTargetRun

## @evidence contracts/development/common.md#meaningful-documentation

Binds a borrowed schedule and report sink to the same run.

## @evidence contracts/development/design.md#principled-representation

The context separates declaration from completed per-step evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A producer only needs its current groups and a place to publish their completed reports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed group leaves no successful report.

# src/physics/IPhysicalCoupledTargetRun.ts#IPhysicalCoupledTargetRun.record

## @evidence contracts/development/common.md#meaningful-documentation

States what is published and the same-step replacement rule.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The simulation that owns the run supplies the sink.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This signature has no executable body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

This signature has no executable body.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The sink's owner bears its cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This signature contains no work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The sink's owner retains the reports for the completed simulation.
