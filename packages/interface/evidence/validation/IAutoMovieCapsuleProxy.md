# src/validation/IAutoMovieCapsuleProxy.ts#IAutoMovieCapsuleProxy

## @evidence contracts/development/design.md#principled-representation

validateCapsule requires two distinct declared FK-reachable bones and a finite positive radius; contact consumers place the endpoints with the supplied evaluated actor pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared endpoint/radius record lets body validation and soft contact use the same authored proxy rather than separate capsule vocabularies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing or unreachable bone is a structural error rather than an invented endpoint; this proxy approximates body geometry and does not assert exact mesh collision.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify actor-local bone endpoints and metre radius, while consumers retain responsibility for actor and world-pose resolution.
