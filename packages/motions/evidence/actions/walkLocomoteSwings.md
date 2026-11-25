# src/actions/walkLocomoteSwings.ts#walkLocomoteSwings

## @evidence contracts/development/common.md#meaningful-documentation

States that every swing is enumerated from the step schedule's stances and carries the schedule's own toe-off and heel-strike seconds, in toe-off order.

## @evidence contracts/development/implementation.md#principled-implementation

Each stance beginning after the start is landed in by one swing of its foot; the foot's schedule read between that stance and the one before it returns that swing's toe-off and heel strike exactly as every later read of it does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over each foot's stances, then one sort by toe-off.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seconds are the schedule's own; none is reconstructed or rounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

One schedule read per footfall and one sort, at plan time only.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk prepares every swing constant from this one list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains one record per footfall, released with it.

# src/actions/walkLocomoteSwings.ts#walkLocomoteSwings.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

States the foot and the swing's two instants.

## @evidence contracts/development/design.md#principled-representation

The swinging foot and its toe-off and heel-strike seconds on the action clock, as the step schedule carries them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `walkLocomoteSwings.of` to the walk's preparation of its swings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The share of a swing is not stored; a read computes it from its second.