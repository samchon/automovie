# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

Caller-selected response to a resolved projectile contact.

## @evidence contracts/development/design.md#principled-representation

kind separates stick depth in metres, bounce restitution/friction, roll resistance and pass speed loss; coefficients are dimensionless except depth and optional roll radius. A bounce optionally carries the struck surface's world velocity, which the impact acts relative to, and the ball the projectile turns as, whose spin takes up part of the sliding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileContinue applies the chosen analytical response using the contact's world normal; it does not select an outcome from material names or modify the original flight.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects invalid selected-outcome coefficients. Supplied bounce-to-roll radius and resistance must both be finite and nonnegative even when the rebound remains a flight. An absent surface is at rest and an absent ball is a particle, never a guessed motion or mass distribution.

# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue.IBall

## @evidence contracts/development/common.md#meaningful-documentation

States the ball's contact radius, its gyration with the solid and thin-shell values, its arriving spin, and the rolling limit it gives friction with its sources.

## @evidence contracts/development/design.md#principled-representation

A rigid ball's impact needs only the centre-to-contact radius, the moment of inertia over m r² and the angular velocity: the three quantities Brach's critical impulse ratio reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by HumanPropOutcome for a spherical launch and read only by projectileContinue's bounce, which returns the spin it leaves on the flight segment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No spin is invented at a release: an absent spin is a ball not turning, and the producer refuses a radius or gyration that is not finite and positive.

# src/physics/IAutoMovieProjectileContinue.ts#IAutoMovieProjectileContinue.Segment

## @evidence contracts/development/common.md#meaningful-documentation

Flight, rolling or resting continuation on the original flight's launch clock.

## @evidence contracts/development/design.md#principled-representation

from and until are seconds since that launch; position/origin are world metres, velocity m/s and rolling deceleration m/s².

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileContinue returns a new segment but may retain source gravity, attitude or pose objects. Its at reader can return borrowed rest positions or held rotations, so consumers treat nested values as read-only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A rolling segment omits along-slope gravitational acceleration; until is Infinity only for nonzero speed with zero deceleration. Optional rotation is absent when the source has no attitude. A flight's spin is present only after a bounce given a ball, and stays constant in flight, which no torque changes.
