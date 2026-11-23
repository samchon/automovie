# src/physics/IAutoMovieAdvancePhysicalBalance.ts#IAutoMovieAdvancePhysicalBalance

## @evidence contracts/development/design.md#principled-representation

Distinguish proposed swings, measured landing acceptance and authored ownership handoffs so checkpoint continuation does not treat a requested step as completed contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance shares the authored footfall pattern while simulation admission supplies optional controller defaults. advancePhysicalBalance mutates this caller-owned state and checkpoint replay preserves the same history rather than reconstructing it from a requested goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Landing requires loaded support, position and speed checks; timeout records failure, and bracing requests bounded target changes rather than fabricated support.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies recovery-step geometry, timing, force limits, landing gates and optional bracing defaults. Distinguishes pending steps, confirmed landings, authored handoffs, recovery clocks and mutable checkpoint ownership.

# src/physics/IAutoMovieAdvancePhysicalBalance.ts#IAutoMovieAdvancePhysicalBalance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared mutable controller state, fresh goal map and optional bracing correction.

## @evidence contracts/development/design.md#principled-representation

World-metre goals and horizontal root displacement are motor intent; rootStrength is the exhaustion/bracing multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance returns state by identity for checkpoint continuation and goals for the physical target planners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A goal requests tracking without certifying support contact; absence of rootShift means no bracing correction was requested.
