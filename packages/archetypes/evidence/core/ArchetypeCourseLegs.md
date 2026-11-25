# src/core/ArchetypeCourseLegs.ts#ArchetypeCourseLegs.plan

## @evidence contracts/development/common.md#meaningful-documentation

Points to the documented caller, which states the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each leg's run on the ground is its length or its radius times its angle, and its length along the path that run times the square root of one plus the grade squared, the hypotenuse of a constant grade. The speed is the engine's `speedProfile` over one distance stretch per leg with marks (topped at the faster of the leg's two marks, or at the cruising speed between two stops) or one stretch over the whole path without (topped at the cruising speed), each pause a seconds stretch at rest. A leg's fastest speed is exact: within each of the profile's phases the acceleration is constant, so speed is monotone there, and its greatest on the leg is at one of the leg's ends or at a phase's start inside it. A turn's position is the arc about its centre; a reversed leg advances along the facing's opposite with the facing kept, and the root pitches nose up by the arctangent of the grade in the direction it travels. A course using none of the optional members goes through the same operations in the same order as before they existed: the profile's single stretch from rest to rest reproduces the trapezoid's arithmetic, a level leg skips the grade's scaling and pitch, and a forward leg the reversal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the course, measure the legs, lay the profile, name the instants and the bends, find each leg's fastest speed, then expose the plan and the profile's distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable mark is refused with its reachable range, never clamped; a second outside the course holds the nearest end state.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning is linear in the legs; a full sample scans the legs and the profile's phases once. Reading only distance skips leg lookup and placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both readers use the same profile sampler and distance arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the course, one row per leg and the profile for as long as its caller keeps it.
