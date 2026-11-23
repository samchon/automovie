# src/human/skeleton/IAutoMovieHumanBindingInputs.ts#IAutoMovieHumanBindingInputs.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

A body's binding inputs.

## @evidence contracts/development/design.md#principled-representation `scale`: Metres per calibration millimetre. `stature`: The calibration's stature, millimetres; the pose evaluator's scale reads it. `joints`: The bind skeleton, calibration millimetres, parent before child.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBindingInputs.derive. Read by AutoMovieHumanBindingInputs.samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `scale`, `stature`, `joints`, `rings`, `neutral`, `turns`, `crotch`, `lips`; callers supply the complete record.
