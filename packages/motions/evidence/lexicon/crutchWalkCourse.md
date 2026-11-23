# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.IAdvance

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its unit and timebase.

## @evidence contracts/development/design.md#principled-representation

An advance is a timed move between two floor frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the frame reader and the hand carry read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both frames come from the stations.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.IClock

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its timebase.

## @evidence contracts/development/design.md#principled-representation

The opening stance's length and one record of instants per station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the plan's stances and the advances read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every instant follows from the authored station times.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.IStationClock

## @evidence contracts/development/common.md#meaningful-documentation

States each instant and its timebase.

## @evidence contracts/development/design.md#principled-representation

Three ordered instants of one station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The instants the stances and advances read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Derived from the station's own seconds and `ADVANCE`.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.refuse

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the thrown refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One affordance refusal naming the setting and the staging that fixes it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One construction shared by the clock and the plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped or defaulted in place of the refusal.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.clock

## @evidence contracts/development/common.md#meaningful-documentation

States the clock's shares and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Cumulative station times split by the advance share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the stations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A malformed station is refused, never skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The plan and each track build their own clock from the same inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh clock and retains nothing.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.stationed

## @evidence contracts/development/common.md#meaningful-documentation

States the rigid carry's formula, frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid motion of the plane: a yaw about the pivot and a translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation, one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The station's own displacement and heading, nothing approximated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh frame and retains nothing.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States both pivots and when each applies.

## @evidence contracts/development/implementation.md#principled-implementation

The walker's station is the centre a rigidly carried crutch turns about; without it only the crutch's own floor point is known.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tip fallback is stated as matching only a walk that never turns.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.advances

## @evidence contracts/development/common.md#meaningful-documentation

States what each advance joins and when.

## @evidence contracts/development/implementation.md#principled-implementation

Chained rigid carries about the walk's pivot on the shared clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the stations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every frame is a station carry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The plan and each track build their own advances from the same inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh advances and retains nothing.

# src/lexicon/crutchWalkCourse.ts#crutchWalkCourse.frameAt

## @evidence contracts/development/common.md#meaningful-documentation

States the planted and moving cases and the lift.

## @evidence contracts/development/implementation.md#principled-implementation

A minimum-jerk blend of position and rotation with a minimum-jerk lift arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan for the current advance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Before the first advance the staged frame, between advances the last plant.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the advances up to the current one.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is its own second's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh frame and retains nothing.
