# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.Stage

## @evidence contracts/development/common.md#meaningful-documentation

Names each stage in order.

## @evidence contracts/development/design.md#principled-representation

A closed union of the six stages of one clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carried by each sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.Tension

## @evidence contracts/development/common.md#meaningful-documentation

Names each state's look.

## @evidence contracts/development/design.md#principled-representation

A closed union the stage determines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carried by each sample and shown by its laid traces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An authored look, not a force reading.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and role.

## @evidence contracts/development/design.md#principled-representation

World metres and seconds, course legs for the drawn and the unloaded travel, positive stage durations and sag.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineDraft` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The parked cart's place is not authored separately: it stands where the horse's hitch stops, so the two cannot disagree.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States each member's space.

## @evidence contracts/development/design.md#principled-representation

The horse's ride sample, the cart's model and placement, and the laid traces and driving lines as world points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the take's sampler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.IInstant

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the label.

## @evidence contracts/development/design.md#principled-representation

A film second and its label, the form every ride's instants take.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read when the take finds its stop instants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.IEvents

## @evidence contracts/development/common.md#meaningful-documentation

Names each boundary.

## @evidence contracts/development/design.md#principled-representation

Ordered film seconds read off the horse's course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned with the take.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.ITake

## @evidence contracts/development/common.md#meaningful-documentation

States the duration, events and sampler.

## @evidence contracts/development/design.md#principled-representation

A pure function of film seconds with its boundaries as data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieArchetypeEquineDraft`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No playback state.

# src/animals/AutoMovieArchetypeEquineDraftPlan.ts#AutoMovieArchetypeEquineDraftPlan.ITake.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the fresh sample.

## @evidence contracts/development/implementation.md#principled-implementation

The horse's ride sample, the cart's towed placement on the hitch while coupled and its parked placement otherwise, and traces laid between their ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the stage, read both supports, lay the lines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every point comes from the posed models; nothing is cached between seconds.

## @evidence contracts/development/implementation.md#efficient-algorithms

One horse sample and one towed sample per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the prepared ride and towing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.
