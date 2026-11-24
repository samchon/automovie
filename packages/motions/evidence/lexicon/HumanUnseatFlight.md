# src/lexicon/HumanUnseatFlight.ts#HumanUnseatFlight.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

origin: The root at the release. velocity: Its velocity then. push: The velocity the fall adds over `TAKE`. land: Seconds from the release to the landing. landed: The root at the landing. slide: Its level velocity on landing. stop: Seconds from the landing until it stops.

## @evidence contracts/development/design.md#principled-representation

Vectors in world metres and metres per second, times in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `at`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanUnseatFlight.ts#HumanUnseatFlight

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The landing is the first root of the height's quadratic in the push phase, else in the free phase; the slide's stopping time is the level speed over the friction's deceleration.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Two quadratics and a quotient.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A release already at or below the height lands at once.

## @evidence contracts/development/implementation.md#efficient-algorithms

Closed form.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Solved once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record.

# src/lexicon/HumanUnseatFlight.ts#HumanUnseatFlight.at

## @evidence contracts/development/common.md#meaningful-documentation

States the phases.

## @evidence contracts/development/implementation.md#principled-implementation

The projectile with a linearly built push, then a uniformly decelerating slide along the landing's level velocity.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One branch per phase.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Closed form.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new point.
