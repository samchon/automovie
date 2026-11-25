# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IPhases

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds; each duration positive except a hold, which may be zero.

## @evidence contracts/development/design.md#principled-representation

A start and three durations, admitted at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extended by each response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IShift

## @evidence contracts/development/common.md#meaningful-documentation

The shift is in metres in the horse's own frame as it stands when the shift starts: X to its left, Y up, Z forward.

## @evidence contracts/development/design.md#principled-representation

Three components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The weight-shift response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IStartle

## @evidence contracts/development/common.md#meaningful-documentation

The planner's authored drop and draw.

## @evidence contracts/development/design.md#principled-representation

Phases only.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The startle response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IBaulk

## @evidence contracts/development/common.md#meaningful-documentation

The planner's authored brace.

## @evidence contracts/development/design.md#principled-representation

Phases only.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The baulk response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IHoof

## @evidence contracts/development/common.md#meaningful-documentation

Names the limb.

## @evidence contracts/development/design.md#principled-representation

Phases and a limb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The response a handler's lifted-hoof care asks for.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IStepAside

## @evidence contracts/development/common.md#meaningful-documentation

The side is the horse's own; the width is metres.

## @evidence contracts/development/design.md#principled-representation

Phases, a side and a positive width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The step-aside response; it ends where it stepped.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IRear

## @evidence contracts/development/common.md#meaningful-documentation

The pitch is degrees, forehand up.

## @evidence contracts/development/design.md#principled-representation

Phases and a positive pitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The rear response and the airs that hold it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IBuck

## @evidence contracts/development/common.md#meaningful-documentation

The pitch is degrees, hindquarters up.

## @evidence contracts/development/design.md#principled-representation

Phases and a positive pitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The buck response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.ISpin

## @evidence contracts/development/common.md#meaningful-documentation

The turn is degrees about up, positive to the horse's left.

## @evidence contracts/development/design.md#principled-representation

Phases and a signed turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The spin response; it ends facing its new heading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.Pivot

## @evidence contracts/development/common.md#meaningful-documentation

The haunches, the middle of the hind hooves; the centre, the middle of all four.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the spin row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.ICrowHops

## @evidence contracts/development/common.md#meaningful-documentation

The count of hops and each hop's pitch, degrees.

## @evidence contracts/development/design.md#principled-representation

Phases, a whole count and a positive pitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The crow-hop response; it ends standing as it began.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.ISetBack

## @evidence contracts/development/common.md#meaningful-documentation

The hindquarters' drop as a trunk pitch, degrees.

## @evidence contracts/development/design.md#principled-representation

Phases and a positive pitch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The set-back response; it ends standing as it began.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.Air

## @evidence contracts/development/common.md#meaningful-documentation

Names both airs and their sourced trunk angles.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The held air's name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.IAir

## @evidence contracts/development/common.md#meaningful-documentation

Names the air.

## @evidence contracts/development/design.md#principled-representation

Phases and an air whose angle is its source's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The held airs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.ICourbette

## @evidence contracts/development/common.md#meaningful-documentation

States the leap count; the hold is the leaping.

## @evidence contracts/development/design.md#principled-representation

Phases and a positive whole number of leaps, three or four usual and five or more for strong horses (Airs above the ground).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The courbette.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.ICapriole

## @evidence contracts/development/common.md#meaningful-documentation

The hold is the flight; its duration sets the ballistic height.

## @evidence contracts/development/design.md#principled-representation

Phases only.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The capriole.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.School

## @evidence contracts/development/common.md#meaningful-documentation

Names the airs.

## @evidence contracts/development/design.md#principled-representation

A discriminated union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `EquineAirs.plan` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineStanceCue.ts#AutoMovieArchetypeEquineStanceCue.Cue

## @evidence contracts/development/common.md#meaningful-documentation

The union of every response.

## @evidence contracts/development/design.md#principled-representation

Discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineStance.after` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
