# src/lexicon/HumanLungePivot.ts#HumanLungePivot.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Seconds since the action's start and headings in degrees, 0 along +Z, positive toward +X.

## @evidence contracts/development/design.md#principled-representation

A start, the leading foot and the feet's heading before and after.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An element of `ISchedule`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLungePivot.ts#HumanLungePivot.ISchedule

## @evidence contracts/development/common.md#meaningful-documentation

The steps in time order and one foot's swing, seconds.

## @evidence contracts/development/design.md#principled-representation

A list and a duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `plan`, read by `foot`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLungePivot.ts#HumanLungePivot.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

Degrees, and the swing's share from 0 to 1 or none while the foot stands.

## @evidence contracts/development/design.md#principled-representation

A heading and an optional share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `foot`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLungePivot.ts#HumanLungePivot.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Scan the bearing; where its lag from the feet reaches `TRIGGER`, lay a step to `TRIGGER` past the bearing at the step's end and skip the step's two swings; measure the pelvis's twist from the feet at every scanned second against `walkReach.TWIST`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A twist beyond the hip's refuses; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bearing read per scanned second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bearing is read once per scanned second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh schedule.

# src/lexicon/HumanLungePivot.ts#HumanLungePivot.foot

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The last step begun: before the foot's swing it keeps the step's start heading, through the swing it turns on a minimum-jerk share, after it keeps the step's end heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan for the step, one branch per phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
