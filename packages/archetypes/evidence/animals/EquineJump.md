# src/animals/EquineJump.ts#EquineJump.IJump

## @evidence contracts/development/common.md#meaningful-documentation

States the clearance's unit.

## @evidence contracts/development/design.md#principled-representation

One authored margin in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.IBaulk

## @evidence contracts/development/common.md#meaningful-documentation

States what the leg must end with.

## @evidence contracts/development/design.md#principled-representation

A marker on a leg the course already brings to rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Lists the two.

## @evidence contracts/development/design.md#principled-representation

A discriminated union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Part of `EquineFootwork.Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.IRequest

## @evidence contracts/development/common.md#meaningful-documentation

States the leg, the margin and the obstacles.

## @evidence contracts/development/design.md#principled-representation

The leg's index and course interval, and the obstacles in order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Passed from `admit` to `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.ITrial

## @evidence contracts/development/common.md#meaningful-documentation

States what the ride hands the planner.

## @evidence contracts/development/design.md#principled-representation

The stride plan, its clock, the rest centre of mass and a sampler of the displayed parts and placement, with the flight once one is known.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `rideQuadruped` for each candidate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.ITrial.sample

## @evidence contracts/development/common.md#meaningful-documentation

States the frames.

## @evidence contracts/development/implementation.md#principled-implementation

The trial ride's own pose at that second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The trial skips only the footing check its unflown body would fail.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose sample per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the ride's pose function.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh model.

# src/animals/EquineJump.ts#EquineJump.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

States the moved landings, the hold and the flight's film seconds.

## @evidence contracts/development/design.md#principled-representation

The stride-plan and clock inputs that realise it, and its two events in film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `rideQuadruped`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.holds

## @evidence contracts/development/common.md#meaningful-documentation

States the order.

## @evidence contracts/development/implementation.md#principled-implementation

The adjustment ends at the push-off, before the flight's hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list.

# src/animals/EquineJump.ts#EquineJump.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Intersect each pole's horizontal segment with the leg's line; its course interval is its radius over the sine of the crossing angle about the crossing, and its top the pole's higher end plus its radius above the leg's ground. A ditch is an interval of the line no authored plane covers, between covered ones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the leg, read the rails, read the ditches, check the bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No obstacle is scaled or skipped to fit a bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K + S log S) for K poles and S planes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's leg span and placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one record.

# src/animals/EquineJump.ts#EquineJump.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each candidate stride's best takeoff spot and least flight come from `spotEquineTakeoff`; the least over all candidates is kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build candidates, spot each, keep the shortest flight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate whose body already overlaps an obstacle at takeoff, or that lands past the leg, is discarded, never adjusted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trial assembly, then `spotEquineTakeoff` once per candidate stride.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The trial assembly is the ride's own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one record.

# src/animals/EquineJump.ts#EquineJump.ISpot

## @evidence contracts/development/common.md#meaningful-documentation

States the two members.

## @evidence contracts/development/design.md#principled-representation

The planned flight and its seconds from final hind liftoff to first fore landing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `spotEquineTakeoff` and compared by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineJump.ts#EquineJump.ICandidate

## @evidence contracts/development/common.md#meaningful-documentation

States each phase.

## @evidence contracts/development/design.md#principled-representation

Stride-plan phases and the moved landings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `plan` and read by `spotEquineTakeoff` and `leastEquineFlight`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
