# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IStationJet

## @evidence contracts/development/design.md#principled-representation

Retains actual first/second station derivatives, with extent values in mm and shoulders dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three entries match the original scalar reader's value and finite station jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No singular or unavailable derivative is represented by an invented zero.

## @evidence contracts/development/common.md#meaningful-documentation

States ordering, scalar units and physical station coordinate.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IRadialJet

## @evidence contracts/development/design.md#principled-representation

Stores total-order-two derivatives of the same radial field, rather than source-p derivatives or a rectangular higher jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six entries suffice for the existing surface product rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No source-p/phase substitution or unused higher derivative is implied.

## @evidence contracts/development/common.md#meaningful-documentation

Gives ordering and physical-station/polar coordinate meanings.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IPrepared

## @evidence contracts/development/design.md#principled-representation

Numeric lookup data is a primal projection of explicit source tuples from the shared geometry factory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source derivatives and their numeric lookup snapshot remain visible records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No callback registration or object identity selects geometry; a broken present snapshot is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States station-local ownership, immutability and equal-value copy semantics.
