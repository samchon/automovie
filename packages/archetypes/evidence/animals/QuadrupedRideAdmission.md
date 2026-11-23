# src/animals/QuadrupedRideAdmission.ts#QuadrupedRideAdmission.IDomain

## @evidence contracts/development/common.md#meaningful-documentation

Names the gait and its speed bounds in metres per second.

## @evidence contracts/development/design.md#principled-representation

The closed interval `AutoMovieArchetypeQuadrupedGait.range` returns, tagged by gait.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the automatic-speed coverage check and its refusal text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedRideAdmission.ts#QuadrupedRideAdmission.admit

## @evidence contracts/development/common.md#meaningful-documentation

States every input and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Cruise, each leg's fastest speed, positive speed marks and nonzero boundary speeds are each read against the gait the leg names, or against the union of declared domains when the speed chooses; a positive speed below the slowest gait's floor is the slowest gait's, at its slowest clock. A collected explicit gait also admits its parent's speeds it is decelerated from, where its clock holds its fastest row (`QuadrupedRideClock.collectedSpeed`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper admits one speed; the passes over legs, marks and boundaries call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Named gaits remain strict except for the declared collection rule; no clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L + G) for L legs and G gaits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's measured leg spans and the strict timing owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after the call.

# src/animals/QuadrupedRideAdmission.ts#QuadrupedRideAdmission.legIndex

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the end case.

## @evidence contracts/development/implementation.md#principled-implementation

A scan of the plan's ordered leg spans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L) in the legs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's spans.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
