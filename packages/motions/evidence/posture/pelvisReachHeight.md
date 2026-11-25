# src/posture/pelvisReachHeight.ts#pelvisReachHeight

## @evidence contracts/development/common.md#meaningful-documentation

States the bound, its geometry, the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The hip joints are rigid with the level pelvis, so lowering the hips lowers each hip joint by the same amount; the greatest hip joint height that keeps an ankle at horizontal offset `h` within reach `R` is `ankle.y + sqrt(R² - h²)`, and the hips take the least drop meeting every ankle. An ankle at or past the reach horizontally takes no bound here: no pelvis height brings it in, and the law's own reach check owns that refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hip read, one closed form a side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach share `STRAIGHT` is provisional and named; nothing else is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One two-hip forward-kinematics read and constant work a side.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `hipJoints`, the one owner of the hip joints' places.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
