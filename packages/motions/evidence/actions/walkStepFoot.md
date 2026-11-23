# src/actions/walkStepFoot.ts#walkStepFoot.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The side, the two instants, the flat footprint, its heading and the push-off before it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven members, all read by the plan and the schedule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The footprint is a placement, the ankle derived by `HumanFoot`.

# src/actions/walkStepFoot.ts#walkStepFoot.IAirborne

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The entry's own foot record: its placement and toes, and its world velocity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the schedule's first swing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the walk foot and vector types.

# src/actions/walkStepFoot.ts#walkStepFoot.pushed

## @evidence contracts/development/common.md#meaningful-documentation

States both rules, their sources and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The turn a foot leaves is its last heading against the pelvis's at the toe-off; the pitch falls with it and is capped for a straight knee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `TURNED_SHARE` is the cited ratio; only the linear fall between straight and fully turned is provisional, and stated so.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the footfalls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Writes the footfalls given and retains nothing.

# src/actions/walkStepFoot.ts#walkStepFoot.windows

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and both results.

## @evidence contracts/development/implementation.md#principled-implementation

A stance runs from a heel strike to the foot's next toe-off; the first from the start, the last to the end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the instants, one per foot for the stances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every footfall names both its instants.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the footfalls but the sort.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays and retains nothing.

# src/actions/walkStepFoot.ts#walkStepFoot.schedule

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each stance is `walkFoot.prepareStance` between a heel strike and the next toe-off; a swing's first half reads the stance it leaves and its second the one it reaches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares one stance reader per footprint, then selects the first unfinished footfall by its heel strike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The last stance is held open, so a foot after its last footfall stays planted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation and storage in the foot's footfalls, logarithmic selection and one stance evaluation per planted read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each swing reuses its two scheduled endpoint stances; the body, side, footfalls, typical stance and raised pitch are fixed for the schedule.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned schedule owns its readers and two endpoints per footfall, released with that plan; no query history is retained.
