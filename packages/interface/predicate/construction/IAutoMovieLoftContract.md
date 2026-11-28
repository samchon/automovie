# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies all four diagnostic fields and the owner of the failure outcome.

## @evidence contracts/development/design.md#principled-representation

Producers create the same reporting record for rejected stations, outlines and solid construction while deciding whether a partial or fallback result survives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record carries producer and premise information needed to locate a failure. Throwing, rollback and partial-result ownership stay with the producing operation.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic.producer

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the producer used to locate the failing piece.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic.level

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the unitless meaning and a concrete producer convention.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic.contract

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes how producers group failures.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic.detail

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains where numerical context appears in the result.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Stations

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the caller's finite-coordinate premise, the minimum-rise check and the unchanged borrowed result.

## @evidence contracts/development/design.md#principled-representation

LoftContract.stations requires a positive minimum step, two or more entries and an adjacent difference at least as large as that step. Coordinates and the mark retain the number-array shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Downstream loft builders reuse the caller's admitted sequence. The type-only mark does not allocate or mutate an array.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Jet

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the role of the bound, units, and aliasing after the check.

## @evidence contracts/development/design.md#principled-representation

LoftContract.jet compares the absolute value of each entry with the supplied bound and asserts a type-only mark on the original array.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The contract preserves the ordinary numeric storage used for coefficients, slopes and curvatures. The producer owns the magnitude and units.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Ring

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives coordinate units, winding order, the projected area check and aliasing.

## @evidence contracts/development/design.md#principled-representation

LoftContract.ring includes the last-to-first edge in the horizontal shoelace sum and requires its absolute value to exceed zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned mark refers to the existing ring representation. The receiving construction operation still owns any shape and plane premises beyond horizontal projected area.
