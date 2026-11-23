# src/physics/trackPhysicalCoupledTargets.ts#trackPhysicalCoupledTargets

## @evidence contracts/development/common.md#meaningful-documentation

States the shared snapshot, the joint plan write and how members reuse it.

## @evidence contracts/development/implementation.md#principled-implementation

Each member keeps its ordinary seed and support rows. One bounded fit supplies every member goal for the interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves the group, seeds members, fits once and writes plans and report.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing group or failed fit throws the typed error before any member plan changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One group fit per step and member revision, instead of one fit per member.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the individual seed, tracking-target sampler, support goals and interval planner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes one serializable plan per member to the run binding and one report to its sink.
