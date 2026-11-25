# src/everyday/gestureJoints.ts#gestureJoints.at

## @evidence contracts/development/common.md#meaningful-documentation

States the result's unit (clinical degrees added to the posture) and each argument's range; the namespace doc gives each gesture's angles and sources.

## @evidence contracts/development/implementation.md#principled-implementation

Joint angles because these gestures bring no body point anywhere: the movement is the segment's own rotation (head nods after Hadar et al. 1985, shrug inside the 30 degree elevation range); each amplitude scales by the envelope times the Effort extent, with nods and shakes on the stroke's cycles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive pattern over the kind writes a fresh delta map; hand gestures and bow return no angles because hand strokes and the gesture law own them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The amplitudes are documented provisional values; no body is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the pattern with `add`, which writes the same deltas into a caller's record instead of a new map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new record and retains nothing.

# src/everyday/gestureJoints.ts#gestureJoints.add

## @evidence contracts/development/common.md#meaningful-documentation

Defines the mutated caller record, the clinical-degree addition, the inputs and that joints the kind does not move are left as they are.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates `at`'s pattern and adds each component to the joint's authored value, or to zero where it has none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `at` and `add` share one pattern function; `at` writes a new delta map and `add` writes into the caller's record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The amplitudes and rhythms are the pattern's; no goal, limit or shape is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One to five bones written per call, with no intermediate delta map.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the pattern with `at`; every call evaluates its own share, envelope and extent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the updated record.
