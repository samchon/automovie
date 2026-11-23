# src/geometry/IAutoMovieFormExpectation.ts#IAutoMovieFormExpectation

## @evidence contracts/development/design.md#principled-representation

Extent ranges and distances in model metres, an exact piece count, genera as integers, points in the model frame, part relations from the contact vocabulary and the mutants the form is meant to equal. The type cannot require `contact` when `pairs` is given or order a range's ends; `checkAutoMovieFormExpectation` refuses the first and reads a reversed range as failing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned with `checkAutoMovieFormExpectation`, its only reader, and written by modelling work and tests. It is an inspection contract, not a screenplay or authoring axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every field is optional because each is an independent claim that is checked only when stated; no field combines with another into a meaningless state except `pairs` without `contact`, which the check refuses. No cast or widening is used.

## @evidence contracts/development/common.md#meaningful-documentation

States the record's purpose and scope, the frame and units, what each field claims and which measure answers it, which fields run on the mutants, and the `contact` requirement.

# src/geometry/IAutoMovieFormExpectation.ts#IAutoMovieFormExpectation.Mutant

## @evidence contracts/development/design.md#principled-representation

The two stand-ins every shape expectation is run against: the axis-aligned box and the convex hull of the placed vertices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `matches`, by the check's `loose` list and as a finding subject.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union, so no unknown mutant can be named.

## @evidence contracts/development/common.md#meaningful-documentation

States what each word stands for.

# src/geometry/IAutoMovieFormExpectation.ts#IAutoMovieFormExpectation.Range

## @evidence contracts/development/design.md#principled-representation

An inclusive pair of metres, minimum first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the size axes and the pair gap.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed-length tuple rather than an open array; the order of its ends is the writer's to keep.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusiveness, order and unit.

# src/geometry/IAutoMovieFormExpectation.ts#IAutoMovieFormExpectation.ISize

## @evidence contracts/development/design.md#principled-representation

One optional extent range per model axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the check's size evaluation; an axis left out is not checked.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional axes are independent claims and combine into no meaningless state.

## @evidence contracts/development/common.md#meaningful-documentation

States each axis's range and unit.

# src/geometry/IAutoMovieFormExpectation.ts#IAutoMovieFormExpectation.IPair

## @evidence contracts/development/design.md#principled-representation

Two part identities in either order, the expected relation from the contact vocabulary and an optional gap range in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the check's pair evaluation and echoed in a pair finding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The relation reuses `IAutoMovieModelContact.Relation` rather than a second vocabulary; no cast.

## @evidence contracts/development/common.md#meaningful-documentation

States each member, that order does not matter and the gap's unit.
