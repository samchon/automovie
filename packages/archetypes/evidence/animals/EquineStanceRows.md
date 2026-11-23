# src/animals/EquineStanceRows.ts#EquineStanceRows.IState

## @evidence contracts/development/common.md#meaningful-documentation

The trunk's rigid motion from the rest model and the anchors in the base model's space, metres.

## @evidence contracts/development/design.md#principled-representation

A motion and four points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each row's start and end.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineStanceRows.ts#EquineStanceRows.IEvent

## @evidence contracts/development/common.md#meaningful-documentation

The label, which phase it falls in and its fraction of that phase's time.

## @evidence contracts/development/design.md#principled-representation

A label, a phase flag and a time fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Turned into instants by the stance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineStanceRows.ts#EquineStanceRows.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

The cue, its start and end states, its pose by share, the shares admitted and its support events.

## @evidence contracts/development/design.md#principled-representation

A record with a pose function.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineStanceRows.ts#EquineStanceRows.IPlan.goal

## @evidence contracts/development/common.md#meaningful-documentation

Share 0 to 1, or to 2 for a step aside.

## @evidence contracts/development/implementation.md#principled-implementation

The row's interpolation of trunk motion and limb states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose per share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Release chains are computed once when planned.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceRows.ts#EquineStanceRows.IPlan.hold

## @evidence contracts/development/common.md#meaningful-documentation

Seconds from the hold's start.

## @evidence contracts/development/implementation.md#principled-implementation

The row's own motion through its hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose per second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the row's planned chains.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceRows.ts#EquineStanceRows.still

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Four placed limbs at zero fold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every row.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceRows.ts#EquineStanceRows.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and output.

## @evidence contracts/development/implementation.md#principled-implementation

Shifts translate the trunk over planted hooves; a lift first carries the proxy centre of mass inside the remaining supports, then folds the released limb from its release chain; a step aside does that for each hoof in turn and swings it on a lifted minimum-jerk path; a rear or a buck pitches about the shoulders or hips to gather, then about the hips or shoulders to lift.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per response kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pitch outside (0, 90) degrees is not planned: the stance refuses it as unreachable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Release chains are solved once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its states and chains.
