# src/sport/cartwheel.ts#cartwheel.wheel

## @evidence contracts/development/common.md#meaningful-documentation

States the shape and that its angles are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

An exercise key on the body (`ExerciseKey.from`), so what it leaves unstated is the body's own standing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `ExerciseKey.from`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/cartwheel.ts#cartwheel.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One table by angle: the shape at that angle is posed, the lowest spoke bears, the root's height sets that joint at its bearing height and the root's place keeps the joint where it came down; a change of spoke hands the place over while both are down, so the root is continuous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shape by angle, the table, the posture by time, the supports from the table's runs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The final posture is returned with no roll, which is the same body as a whole turn, so the next action does not unwind it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original 73 table rows use demanded spoke FK. The fixed standing/wheel pair and its ordered joint union prepare once; row/playback interpolation allocates only the actual key/joints. Entry FK requests only ankles; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the exercise key's one prepared blend owner, standing plan and GymnasticsWheel table. Only unchanged body-dependent endpoint keys are shared; every queried angle still evaluates its original interpolation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over its table and one fixed key-pair reader; queried shapes retain no history or FK reader.
