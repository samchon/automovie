# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.Hitch

## @evidence contracts/development/common.md#meaningful-documentation

Names each hitch's arrangement.

## @evidence contracts/development/design.md#principled-representation

A closed union the layout expands into places.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The teams the scene list and the issue name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.Role

## @evidence contracts/development/common.md#meaningful-documentation

States what each role can do.

## @evidence contracts/development/design.md#principled-representation

A closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the states and the lines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.Stage

## @evidence contracts/development/common.md#meaningful-documentation

Names each stage.

## @evidence contracts/development/design.md#principled-representation

A closed union read off the team course's speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carried by each sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and sign of each offset.

## @evidence contracts/development/design.md#principled-representation

A role and two metre offsets in the team's path frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by the layout and read by every horse's course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

The pole head's legs, start and speeds, positive spacings and rates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineTeam` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each horse's course is derived from this one, never authored apart, so the horses cannot drift out of their places.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States each member's space.

## @evidence contracts/development/design.md#principled-representation

Each horse's ride sample in place order, the vehicle's model and placement, the laid spans and the per-horse breeching state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the team's sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.ITeam

## @evidence contracts/development/common.md#meaningful-documentation

States the places, rides, braking second and sampler.

## @evidence contracts/development/design.md#principled-representation

The expanded places, every horse's own ride and a pure sampler.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieArchetypeEquineTeam`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No playback state.

# src/animals/AutoMovieArchetypeEquineTeamPlan.ts#AutoMovieArchetypeEquineTeamPlan.ITeam.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the fresh sample.

## @evidence contracts/development/implementation.md#principled-implementation

Each horse's own ride, the vehicle towed by the pole head, and spans laid between the collar parts and the vehicle's bars.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read every ride and the vehicle, then lay the spans by role and stage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every span end is a posed part or a vehicle-rigid point; nothing is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sample per horse and one vehicle sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the prepared rides and towing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.
