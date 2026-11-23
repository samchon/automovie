# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.IFootprint

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame, unit and range.

## @evidence contracts/development/design.md#principled-representation

A convex outline in metres, y ignored, grown by a radius of at least 0; `conflicts` refuses an empty or nonfinite outline and a negative radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; given by a participant and an obstacle, and made from a model by `footprint`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.IParticipant

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A unique name, the plan whose placement carries the footprint, and a margin in metres of at least 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a mounted pair, a walker or a vehicle in a passage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.IObstacle

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A unique name, a footprint in the world and a margin in metres of at least 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a dais, a barrier or a reviewing stand in a passage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit, default and range.

## @evidence contracts/development/design.md#principled-representation

The bodies, a window in film seconds and a sampling step in seconds; `conflicts` refuses duplicate names, a window that does not run forward and a step that is not positive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the argument of `conflicts` and `admit`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.IConflict

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The two names, the interval and the closest instant in film seconds, and the closest and required clearances in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; listed by `conflicts` and carried by `admit`'s refusal as its value.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.footprint

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, the frame and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's `computeModelRestExtent`, which places every part vertex as the renderer does, read on the floor axes. A posed body's limbs reaching beyond the rest pose are outside it, so the caller's margin covers them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measurement and its four corners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A model with nothing to measure is refused, never given a stand-in size.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the model's vertices inside the engine's measurement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one model; a caller footprinting many members of one model keeps the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.envelope

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, the frame, the window and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's `computeModelRestExtent` of each posed model read every step, whose parts already stand where the ride put them in the root's frame; the union of those extents bounds every read pose. A pose reaching further between reads is outside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One extent per read and a running union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is padded; an unmeasurable ride is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose and one vertex pass per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the ride and window.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.conflicts

## @evidence contracts/development/common.md#meaningful-documentation

States the result's order and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The clearance of two placed footprints is the least distance between their convex hulls, from the engine's segment distance over edge pairs and zero when one hull holds the other's vertex, less both radii. It is continuous in time because each plan's placement is. Instants every `step` locate each run below the margin; bisection between an admitted and a refused instant places each end, and golden-section search refines the closest instant of a run and every sampled minimum between instants, so a dip between two admitted instants is found when it is the bracket's one minimum. A level run is refined once, at its first instant. A dip that enters and leaves between instants with no sampled minimum beside it is not proven absent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the inputs and hull every footprint once, measure every pair at every instant, then scan each pair's run of values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Margins and the step are the caller's; no clearance is clamped and no pair is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P participants, O obstacles, T instants and hulls of at most V vertices: T*P placements and T*(P*P/2+P*O) hull distances of O(V*V), plus a fixed number of refinements per run and per sampled minimum.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each participant is placed once per instant and that placement serves all its pairs; the hulls are built once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call holds the T*P placed hulls and T values per pair until it returns the conflicts.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.obstacle

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the motion and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The hull of the outline is the convex footprint the steering pass reads in the body's frame, and the yaw is the plan's forward axis seen from above, the same convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hull and one reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rounded footprint is refused rather than shrunk to its core. The participant's margin grows the hull outward with mitred corners, which hold every point within the margin, so steering keeps the authored clearance; the steered courses are still verified with `conflicts`.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hull; constant work per reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one participant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The motion keeps the participant's plan for as long as the obstacle is held.

# src/core/AutoMovieArchetypePassage.ts#AutoMovieArchetypePassage.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the refusal's axis, value, range and reason.

## @evidence contracts/development/implementation.md#principled-implementation `conflicts`, then the first in time order; the later-listed participant's route is the one an author reroutes against the earlier, and against an obstacle the participant's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measurement and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is admitted inside a margin.

## @evidence contracts/development/implementation.md#efficient-algorithms

As `conflicts`, plus a scan of the participant names.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One call of `conflicts`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
