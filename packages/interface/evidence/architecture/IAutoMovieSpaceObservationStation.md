# src/architecture/IAutoMovieSpaceObservationStation.ts#IAutoMovieSpaceObservationStation

## @evidence contracts/development/design.md#principled-representation

The population is a closed function of the space's stated volume and the openings on its boundaries, so a review's denominator is derived from the record and a station that cannot be placed stays counted with a null pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An id, a role, the threshold's opening and one nullable pose, which is what a review needs to aim a camera and to count coverage; placement rules live in the producer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unplaceable stations are reported with a null pose rather than dropped or moved outside the space, so a hard topology never shrinks its own denominator.

## @evidence contracts/development/common.md#meaningful-documentation

States producer, station roles/order, volume-less exclusion, identities and nullable pose. Every returned eye passes the producer's numerical containment predicate, and aim requires finite non-negligible length; these are numerical checks rather than exact-real certificates.
