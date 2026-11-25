# src/geometry/IAutoMovieMeasureModelContacts.ts#IAutoMovieMeasureModelContacts.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

States the contact distance's unit, what it decides and that a missing, negative or non-finite value is refused.

## @evidence contracts/development/design.md#principled-representation

One required distance in metres; nonnegativity and finiteness are left to the report's runtime admission because the type cannot state them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The report and the form expectation check, which passes its own `contact`, are its consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The distance is required rather than defaulted, because no default suits every scale of form.
