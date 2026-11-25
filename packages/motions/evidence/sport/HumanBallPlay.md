# src/sport/HumanBallPlay.ts#HumanBallPlay.read

## @evidence contracts/development/common.md#meaningful-documentation

Defines the event sources, the film clock and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

Possessions join one performer's overlapping or touching hand grips on the ball in film order, so a change of hands is not a change of custody; launches and contacts are each flight's projectile start, first contact (film seconds) and continuation-leg contacts (timed from the launch, so offset by it), which the flight already limits to its custody.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Grip and flight ownership stay with HumanPerformanceRead and HumanPropFlight; this function only projects and orders their records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Records no contact the flight did not resolve and infers no possession from proximity.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(G log G) to order G grips, O(F + K) projection for F flights and K contacts, then one O(E log E) sort of the E events.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the performance's cached flights and grips without resweeping.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh event list and retains nothing; borrowed struck records are shared with the flights.

# src/sport/HumanBallPlay.ts#HumanBallPlay.crossing

## @evidence contracts/development/common.md#meaningful-documentation

States the sampling rate, the crediting direction, the window and the undetected case.

## @evidence contracts/development/implementation.md#principled-implementation

A continuous displayed path that changes the sign of its plane distance crosses the plane in the bracket; bisection converges to the crossing, and the region test is applied at that point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame reading stays with the performance; only the plane and region geometry live here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the same frames a render shows; no closed form per sport is assumed, and a reversal inside one interval is documented rather than hidden.

## @evidence contracts/development/implementation.md#efficient-algorithms

O((to - from) * 240 + 40 per bracket) frame reads, each a projectile or carrier sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the performance's placed flights for every frame read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no frame; allocates a few vectors per sample.
