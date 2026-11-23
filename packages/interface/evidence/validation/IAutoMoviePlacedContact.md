# src/validation/IAutoMoviePlacedContact.ts#IAutoMoviePlacedContact.ISupportSample

## @evidence contracts/development/common.md#meaningful-documentation

Defines world observation, metre-valued local anchor, positive support normal and active rolling contact ownership.

## @evidence contracts/development/design.md#principled-representation

A rigid frame establishes local XZ tangent directions and the local positive Y normal. The anchor and actual point are separate observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support owner can supply floor, moving deck or currently active rolling point through the same record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The anchor comes from the contact declaration or plan. An evaluated point cannot serve as its own target.

# src/validation/IAutoMoviePlacedContact.ts#IAutoMoviePlacedContact.IGripSample

## @evidence contracts/development/common.md#meaningful-documentation

Defines the actual hand socket, prop world frame and authored target in hand-local metres and unit orientation.

## @evidence contracts/development/design.md#principled-representation

Two actual rigid placements determine the prop's relationship to the hand. The owner supplies an independent target for the same instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The grip owner folds the declared in-hand motion into its target and supplies the correct claimant at handoff boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fixture-specific object, guessed held offset or always-fixed grip assumption is required.

# src/validation/IAutoMoviePlacedContact.ts#IAutoMoviePlacedContact.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the report path, absent observation effect, maximum absolute normal gap, maximum tangential slip and grip limits.

## @evidence contracts/development/design.md#principled-representation

The discriminant ties each geometry relation to its own finite nonnegative limits. Grip angle uses radians in [0, π].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the current placed evidence and thresholds enter Engine. Timeline, custody selection and report aggregation remain with the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An omitted sample does not imply zero gap, perfect grip or no active expectation.

# src/validation/IAutoMoviePlacedContact.ts#IAutoMoviePlacedContact.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Describes the axis and sign of gap, the tangential metric, grip separation units and each coverage case.

## @evidence contracts/development/design.md#principled-representation

The measured arm keeps explicit metrics and breaches. An invalid arm reports numeric or structural input problems. The unsupported arm carries no invented measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Measures and canonical validation findings let the adapter report a located check without repeating the computation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refused input cannot be mistaken for a measured contact. A measured contact can carry violations.
