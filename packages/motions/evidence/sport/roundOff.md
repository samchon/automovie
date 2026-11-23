# src/sport/roundOff.ts#roundOff.landed

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

Reuses `ExerciseKey.from` and `ExerciseKey.stood`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/roundOff.ts#roundOff.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The shape at an angle is the cartwheel's wheel in the first half and closes to `landed` in the second; its heading turns by the quarter turns; the wheel table rolls it over both feet, each foot, each hand and both feet again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shape by angle, the table, the angle by time, the supports from the table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The final posture is returned with no roll, the same body as a whole wheel, so the next action does not unwind it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Original table rows retain demanded spoke FK. Standing/wheel/landing keys and two ordered joint unions prepare once; each changing angle performs its actual interpolation. Entry FK requests only ankles; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses cartwheel geometry/step, prepared exercise blends and the standing plan. Fixed key endpoints are shared within this plan, with no time-keyed shape cache or changed interpolation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its table and two fixed key-pair readers, without retaining query postures or FK readers.
