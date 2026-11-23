# src/validation/IAutoMovieValidation.ts#IAutoMovieValidation

## @evidence contracts/development/design.md#principled-representation

toValidation returns failure when any collected item has error severity, success with warnings for a warning-only list and clean success for an empty list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The success discriminator separates a permitted artifact from the complete refusal list while keeping nonblocking advice available.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Warnings are not discarded to manufacture clean success, and failure retains warnings as well as errors from the checks that actually ran.

## @evidence contracts/development/common.md#meaningful-documentation

Comments define warning-only success, optional warning omission and the failure list; this envelope does not prove that every possible validator ran.

# src/validation/IAutoMovieValidation.ts#IAutoMovieValidation.ISuccess

## @evidence contracts/development/design.md#principled-representation

The canonical wrapper reaches this arm only when no collected item is an error; a nonempty warning-only collection is retained under warnings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A true discriminator and optional advice suffice; there is no redundant empty violations list on clean success.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Success denotes the outcome of the invoked checks, not proof that uninvoked geometry, physics or review checks passed.

## @evidence contracts/development/common.md#meaningful-documentation

The warning member explains nonblocking advice and omission when the collected list is empty.

# src/validation/IAutoMovieValidation.ts#IAutoMovieValidation.IFailure

## @evidence contracts/development/design.md#principled-representation

toValidation selects this arm if some item is an error and returns the original collected list in insertion order, including its warnings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One refusal list preserves the evidence needed for correction without parallel error and warning arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Failure does not collapse the list to its first error or claim checks after an early refusal were run.

## @evidence contracts/development/common.md#meaningful-documentation

The false discriminator and list comment explain the nonempty canonical result and inclusion of all tiers that actually ran.
