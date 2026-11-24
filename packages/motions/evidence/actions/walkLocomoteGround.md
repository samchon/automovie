# src/actions/walkLocomoteGround.ts#walkLocomoteGround.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is settled once per swing, in which order and why each settle reads only swings already prepared.

## @evidence contracts/development/implementation.md#principled-implementation

A swing's flight claim, scheduled descent and stance ends are constants of its step. In toe-off order each swing's two stance readings before its toe-off are settled, then its flight claim (`runStance.airborne`) or scheduled descent (`walkDescent.plan`); its landing and the other foot's mid-swing stance are settled after every swing is prepared. A stance is settled at an earlier second than the swing it departs into, so a settle reads only swings prepared before it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `walkLocomote`'s closure as the owner of the pelvis's settling; the per-second settle and the schedule-only reach claim are module functions reading the context.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A read of a swing or an end the plan did not prepare is refused, not settled on demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four stance settles and one flight or descent per swing, at plan time; a read settles only its own second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every read of a swing shares its prepared claims and ends.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains four ends and one claim pair or descent per swing, released with it.

# src/actions/walkLocomoteGround.ts#walkLocomoteGround.scheduled

## @evidence contracts/development/common.md#meaningful-documentation

States that the end is the foot as its schedule alone has it.

## @evidence contracts/development/implementation.md#principled-implementation

The scheduled placement's ankle and rotation and its toes, before any pelvis is settled.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field-for-field projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is settled or adjusted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the schedule-only swings and by legs a read does not demand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkLocomoteGround.ts#walkLocomoteGround.IContext

## @evidence contracts/development/common.md#meaningful-documentation

States each member the settling reads.

## @evidence contracts/development/design.md#principled-representation

The body, gait, step schedule, pelvis path and angles, knee-floor bound, support height and schedule-only swings, each its owner's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `walkLocomote` for `walkLocomoteGround.prepare`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A gait without a bounded support height has no support, not a zero one.

# src/actions/walkLocomoteGround.ts#walkLocomoteGround.IGround

## @evidence contracts/development/common.md#meaningful-documentation

States the settle and the prepared ends.

## @evidence contracts/development/design.md#principled-representation

The pelvis settled at any second from the prepared swing claims, and a foot's settled stance at one of the swings' prepared ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the legs' solve and by the reached swings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An end the plan did not prepare is refused.