# src/perform/HumanPerformanceOverlays.ts#HumanPerformanceOverlays.IPlanned

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it is.

## @evidence contracts/development/design.md#principled-representation

The facts of one planned action that an overlay record is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, each read by `place`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plan and the context are the ones the law made, passed on unchanged.

# src/perform/HumanPerformanceOverlays.ts#HumanPerformanceOverlays.place

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The carrier's yields bound the claims at entry. The schedule checks the interval against earlier claims after resolving the overlay's end. A held prop passes to the overlay as it does to any placed action.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Checks carrier yields, builds the overlay and registers it with the performer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A claim is admitted only when the carrier yields it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the hold to `HumanPerformanceContacts.hold`.

## @evidence contracts/development/implementation.md#efficient-algorithms

The yield check reads the channel lists. Hold admission reads the performer's holds and the plan's contacts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The overlay record is owned by its performer.

# src/perform/HumanPerformanceOverlays.ts#HumanPerformanceOverlays.finish

## @evidence contracts/development/common.md#meaningful-documentation

Gives the timing, placement order and conflict condition.

## @evidence contracts/development/implementation.md#principled-implementation

Exclusive claims are compared only over a positive intersection of the resolved intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Publishes the end before comparing the current overlay against earlier placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the scheduler's actual end and the shared channel coverage rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits the performer's previously placed overlays in order and compares claims only when times intersect.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Updates the existing overlay record shared by placement and final validation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Adds no retained state.

# src/perform/HumanPerformanceOverlays.ts#HumanPerformanceOverlays.validate

## @evidence contracts/development/common.md#meaningful-documentation

Names when validation runs, whose schedule it reads and which overlap it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

Compares the overlay interval with the active span between carrier entries, including cuts. At equal entry times the last carrier owns the span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Checks positive overlap before applying the shared claim admission rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies placement's same channel coverage rule to an already running overlay so that a change of carrier cannot bypass it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sweeps sorted overlay starts and retires ended overlays as each carrier takes over.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses placement's claim admission and the resolved schedule.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The check retains no state.
