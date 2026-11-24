# src/cinematics/IAutoMovieCheckExposureContinuity.ts#IAutoMovieCheckExposureContinuity

## @evidence contracts/development/common.md#meaningful-documentation

Names the operation; its members document the cuts, the tolerance and the findings.

## @evidence contracts/development/design.md#principled-representation

A namespace grouping the checker's input, cut and finding records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns it for `checkAutoMovieExposureContinuity`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.

# src/cinematics/IAutoMovieCheckExposureContinuity.ts#IAutoMovieCheckExposureContinuity.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States that the cuts are in playing order and the tolerance's unit, range and default.

## @evidence contracts/development/design.md#principled-representation

Order is the array's order; the tolerance is in stops, the unit of EV100.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both fields are read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional tolerance has one default.

# src/cinematics/IAutoMovieCheckExposureContinuity.ts#IAutoMovieCheckExposureContinuity.ICut

## @evidence contracts/development/common.md#meaningful-documentation

Documents the index's identity and uniqueness, the group's meaning and why cross-cutting compares within a group, the EV100 unit and the meaning of `change`.

## @evidence contracts/development/design.md#principled-representation

The sequence entry index identifies the cut for the reader; uniqueness is a runtime check because a type cannot state it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read by the checker.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`change` is an optional flag with one meaning; absent and false are the same.

# src/cinematics/IAutoMovieCheckExposureContinuity.ts#IAutoMovieCheckExposureContinuity.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

Documents both cuts' indices and EV100 values and their shared group.

## @evidence contracts/development/design.md#principled-representation

Both cuts are named so the reader can open either; the difference follows from the two values and is not stored.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five fields, the ones the issue asks a finding to name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.
