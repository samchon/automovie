# src/physics/IAutoMovieAdvancePhysicalBalance.ts#IAutoMovieAdvancePhysicalBalance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared mutable controller state, fresh goal map and optional bracing correction.

## @evidence contracts/development/design.md#principled-representation

World-metre goals and horizontal root displacement are motor intent; rootStrength is the exhaustion/bracing multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance returns state by identity for checkpoint continuation and goals for the physical target planners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A goal requests tracking without certifying support contact; absence of rootShift means no bracing correction was requested.
