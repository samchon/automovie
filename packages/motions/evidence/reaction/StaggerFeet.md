# src/reaction/StaggerFeet.ts#StaggerFeet

## @evidence contracts/development/common.md#meaningful-documentation

States what is read at a second, from which course, and how a swing is shaped.

## @evidence contracts/development/design.md#principled-representation

One plan's feet with the memoised stance ends, swing curves and bows they share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The readings the plan's leg row writes from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The clearance, the lift and the sampling rate are `staggerBounds`'; the bow is the soles' own clearance.

# src/reaction/StaggerFeet.ts#StaggerFeet.prototype.shifted

## @evidence contracts/development/common.md#meaningful-documentation

States what the shift governs, why the ends must share it, the measured defect and the argument's meaning.

## @evidence contracts/development/implementation.md#principled-implementation

A swing's two ends are the stances of its two instants, so they are settled by the one settlement the pose uses there, shift included.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kept reader and three cleared maps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing settled under an earlier shift is kept: ends, swing curves and bows all go.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each change of the shift costs two settlements and one swing curve a declared step, lazily.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ends, swings and bows stay kept per step while one shift stands; equivalence is the same step under the same shift reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the reader for the plan's life; the cleared maps refill to at most two ends and one swing and bow a step.

# src/reaction/StaggerFeet.ts#StaggerFeet.prototype.settle

## @evidence contracts/development/common.md#meaningful-documentation

States the time, the root's course, the hips read upright and the settling.

## @evidence contracts/development/implementation.md#principled-implementation

The pelvis carries the centre of mass's course (Hof's pendulum and its settling) less the trunk's measured mass shift, and the walk's ground settling lowers it to the closed-form height the planted legs allow, each heel rising about its ball where the ankle runs out of room.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the course, place the root, settle with the walk's owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fit, tolerance, time memo or posed-result cache is introduced; the settling is the walk's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course read and one ground settling: a bracketed scalar root over at most two stance readers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk's ground owner settles every query; an optional parent FK source reaches only its hip reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains neither the FK source nor its result after return.

# src/reaction/StaggerFeet.ts#StaggerFeet.prototype.standing

## @evidence contracts/development/common.md#meaningful-documentation

Reads action-local seconds and returns fixed placement/toe records for both sides.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the ordered landed-step updates under the land-1e-9 comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Entry feet form the base and one step scan replaces each landed side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves step order, endpoint placements and the landing comparison without interpolation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(s) work for s recovery steps and two output slots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the fixed entry/step placement geometry while producing a fresh two-foot schedule per query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fixed-size schedule and retains no queried time or schedule.

# src/reaction/StaggerFeet.ts#StaggerFeet.prototype.scheduled

## @evidence contracts/development/common.md#meaningful-documentation

Uses seconds since the push and the open swing intervals.

## @evidence contracts/development/implementation.md#principled-implementation

Starts from the landed feet and applies the bowed walking-foot law only for start<seconds<land, its bow the step's closed-form soles' clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One standing schedule and one step scan delegate active swing geometry to swungAt; end owns settled endpoints and staggerSwingBow the bow.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every interval predicate, endpoint, lift and bow; only declared step endpoints enter the endpoint map.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(s) schedule scans for s recovery steps, plus one closed-form bow per step on its first query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoints, swing curves and bows are kept per declared step of this fixed recovery; every queried share is evaluated afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most two endpoints and one swing/bow record per declared step remain with this finite recovery's plan.

# src/reaction/StaggerFeet.ts#StaggerFeet.prototype.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the common clock and each part of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Schedule both feet, settle the pelvis on the recovery's centre of mass course and reach each swinging foot with the walk's leg-range hold, in world metres, degrees and action seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One schedule and settlement precede at most two swings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The walk's foot and leg owners perform every hold; the result is not memoized by time.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(s) step scans, one course read, one ground settling and at most two prepared swing holds; no stance course and no iterative leg fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body-only reach readers serve the fixed body; all current-time feet remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result belongs to this evaluation; the FK loan ends with settlement.
