# src/physics/physicalQuadTouchdown.ts#physicalQuadTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

States the landing and timeout rules, the full seat and the adjustment's clearing, each with its 201903 source.

## @evidence contracts/development/implementation.md#principled-implementation

201903 `QuadrupedSwingState`: the touchdown trigger after 0.8 of the swing since lift-off (l.133, l.317-329), the wrench switch at 4 % of the weight (main's decision, `QuadrupedWrenchBasedFootSwitch` l.36) through its trigger over one of the reference's 1 ms updates (`QuadrupedFootControlModuleParameters` l.20, `GenericQuadrupedSimulationFactory` l.38), its time kept (main's Q9), else the timeout at the interval's end (l.331-341, l.146); support fully constrained at once (`QuadrupedSupportState.onEntry` l.74-84); `completedStep` through the transition callback (l.493-494).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the swings; the writes in one helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read each swing's quadrant, which the gait names for every bone, and the state's swings and gait, set just before.

## @evidence contracts/development/implementation.md#efficient-algorithms

One switch reading per swing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; a landing adds one record to the caller's state.
# src/physics/physicalQuadTouchdown.ts#physicalQuadTouchdown

## @evidence contracts/development/common.md#meaningful-documentation

Documents the constants with their sources.

## @evidence contracts/development/design.md#principled-representation

The minimum phase, a share of the swing, and the trigger's window, the reference's updates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Constants only.
