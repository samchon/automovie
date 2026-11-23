# src/animals/QuadrupedTimedCues.ts#QuadrupedTimedCues

## @evidence contracts/development/common.md#meaningful-documentation

States what a cue requests and where the speed still chooses.

## @evidence contracts/development/design.md#principled-representation

A cue is a film-second interval and a gait, lowered to the same legs a course of legs states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by QuadrupedTimedRoute; the stride decision and admission read the legs as they always do.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No row order or speed picks a cued gait; a gait the speed cannot carry is refused by the ride's admission.

# src/animals/QuadrupedTimedCues.ts#QuadrupedTimedCues.ICue

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds and the gait's names.

## @evidence contracts/development/design.md#principled-representation

An interval and the leg's own gait and lead.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a timed path adds to a plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedTimedCues.ts#QuadrupedTimedCues.ICued

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

The plan as given and its requests.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Accepted by rideQuadruped beside a plan and a course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedTimedCues.ts#QuadrupedTimedCues.split

## @evidence contracts/development/common.md#meaningful-documentation

States the split and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A cue's seconds become the plan's distances there; the stretches between keep no gait, so the speed chooses there by the declared change rule; each stretch's span records its fastest speed for the admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, cut, scan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The plan's geometry and timing are untouched; only the legs' names change.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C) cuts and a 10 ms scan of the plan for the fastest speeds, as the halts are scanned.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the plan's samplers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a small route.
