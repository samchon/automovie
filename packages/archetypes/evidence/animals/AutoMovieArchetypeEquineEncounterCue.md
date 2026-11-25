# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.Horse

## @evidence contracts/development/common.md#meaningful-documentation

The first or the second horse given.

## @evidence contracts/development/design.md#principled-representation

An index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every act's actor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.Region

## @evidence contracts/development/common.md#meaningful-documentation

Names each region; each is a bar of the body.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The aim of the contact acts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IThreat

## @evidence contracts/development/common.md#meaningful-documentation

Its actor and window.

## @evidence contracts/development/design.md#principled-representation

An actor and an expression window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An act.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IBite

## @evidence contracts/development/common.md#meaningful-documentation

Its actor, window and region.

## @evidence contracts/development/design.md#principled-representation

An actor, an expression window and a region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An act.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IStrikeAct

## @evidence contracts/development/common.md#meaningful-documentation

Its actor, phases, striking leg and region.

## @evidence contracts/development/design.md#principled-representation

An actor, stance phases, a side and a region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An act.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IKickAct

## @evidence contracts/development/common.md#meaningful-documentation

Its actor, phases and region.

## @evidence contracts/development/design.md#principled-representation

An actor, stance phases and a region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An act.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.Act

## @evidence contracts/development/common.md#meaningful-documentation

The union of the acts.

## @evidence contracts/development/design.md#principled-representation

Discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineEncounter.stage` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IStrike

## @evidence contracts/development/common.md#meaningful-documentation

The point is the struck surface in the striker's base model space.

## @evidence contracts/development/design.md#principled-representation

Phases, a side and a point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A stance row the encounter plans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Both in the attacker's base model space.

## @evidence contracts/development/design.md#principled-representation

A point and a unit normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The strike's and each kicking hoof's aim.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IKick

## @evidence contracts/development/common.md#meaningful-documentation

Each hind hoof's contact on the kicked surface.

## @evidence contracts/development/design.md#principled-representation

Phases and two contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A stance row the encounter plans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.Row

## @evidence contracts/development/common.md#meaningful-documentation

The union of the rows.

## @evidence contracts/development/design.md#principled-representation

Discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Joins the stance's cue union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IHorse

## @evidence contracts/development/common.md#meaningful-documentation

Its producer's model, its ride to the encounter and an optional retreat.

## @evidence contracts/development/design.md#principled-representation

A model, a ride and an optional retreat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineEncounter.stage` takes per horse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineEncounterCue.ts#AutoMovieArchetypeEquineEncounterCue.IRetreat

## @evidence contracts/development/common.md#meaningful-documentation

The ride's own clock starts at `from`.

## @evidence contracts/development/design.md#principled-representation

A start second and a ride.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A horse's optional retreat.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
