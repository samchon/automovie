# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue

## @evidence contracts/development/common.md#meaningful-documentation

Caller-selected response to a resolved projectile contact. Flight, rolling or resting continuation on the original flight's launch clock.

## @evidence contracts/development/design.md#principled-representation

kind separates stick depth in metres, bounce restitution/friction, roll resistance and pass speed loss; coefficients are dimensionless except depth and optional roll radius. from and until are seconds since that launch; position/origin are world metres, velocity m/s and rolling deceleration m/s².

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileContinue applies the chosen analytical response using the contact's world normal; it does not select an outcome from material names or modify the original flight. projectileContinue returns a new segment but may retain source gravity, attitude or pose objects. Its at reader can return borrowed rest positions or held rotations, so consumers treat nested values as read-only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects invalid selected-outcome coefficients. Supplied bounce-to-roll radius and resistance must both be finite and nonnegative even when the rebound remains a flight. A rolling segment omits along-slope gravitational acceleration; until is Infinity only for nonzero speed with zero deceleration. Optional rotation is absent when the source has no attitude.

# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

Caller-selected response to a resolved projectile contact.

## @evidence contracts/development/design.md#principled-representation

kind separates stick depth in metres, bounce restitution/friction, roll resistance and pass speed loss; coefficients are dimensionless except depth and optional roll radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileContinue applies the chosen analytical response using the contact's world normal; it does not select an outcome from material names or modify the original flight.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects invalid selected-outcome coefficients. Supplied bounce-to-roll radius and resistance must both be finite and nonnegative even when the rebound remains a flight.

# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue.Segment

## @evidence contracts/development/common.md#meaningful-documentation

Flight, rolling or resting continuation on the original flight's launch clock.

## @evidence contracts/development/design.md#principled-representation

from and until are seconds since that launch; position/origin are world metres, velocity m/s and rolling deceleration m/s².

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileContinue returns a new segment but may retain source gravity, attitude or pose objects. Its at reader can return borrowed rest positions or held rotations, so consumers treat nested values as read-only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A rolling segment omits along-slope gravitational acceleration; until is Infinity only for nonzero speed with zero deceleration. Optional rotation is absent when the source has no attitude.
