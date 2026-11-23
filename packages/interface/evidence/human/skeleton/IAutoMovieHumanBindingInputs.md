# src/human/skeleton/IAutoMovieHumanBindingInputs.ts#IAutoMovieHumanBindingInputs

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanBindingInputs exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInputs. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanBindingInputs; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInputs contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/skeleton/IAutoMovieHumanBindingInputs.ts#IAutoMovieHumanBindingInputs.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

A body's binding inputs.

## @evidence contracts/development/design.md#principled-representation `scale`: Metres per calibration millimetre. `stature`: The calibration's stature, millimetres; the pose evaluator's scale reads it. `joints`: The bind skeleton, calibration millimetres, parent before child.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBindingInputs.derive. Read by AutoMovieHumanBindingInputs.samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `scale`, `stature`, `joints`, `rings`, `neutral`, `turns`, `crotch`, `lips`; callers supply the complete record.
