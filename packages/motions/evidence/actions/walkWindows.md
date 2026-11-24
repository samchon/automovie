# src/actions/walkWindows.ts#walkWindows

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the results.

## @evidence contracts/development/implementation.md#principled-implementation

Each instant is its second over the duration. At each original STEP, walkReach.footPivot reads the same stance foot's spin as the full pelvis would and splits the window on changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the instants and one pass per stance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stance in which the foot never spins stays one plant, as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

One yaw and one foot query per original STEP of stance, with no opposite-foot, root, pelvic-angle or FK demand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The pivot formula is shared with full pelvis placement. No sampled result is kept.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays and retains nothing.
