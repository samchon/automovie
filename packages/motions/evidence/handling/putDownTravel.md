# src/handling/putDownTravel.ts#putDownTravel

## @evidence contracts/development/common.md#meaningful-documentation

Both paths share the resting wrist frame and optionally visit an aligned aperture.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk spans reach rest at the opening and each authored waypoint. Empty-hand withdrawal reverses the same physical corridor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build an ordinary path or compose the aperture spans, sharing their geometry between placement and withdrawal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The aperture supplies the direction and distance of insertion.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original direct and aperture paths require constant work. A path with waypoints builds one span per pair of frames and samples only the active span.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

HumanPrehension owns movement timing, paths and attitude interpolation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Samplers retain only fixed movement data.
