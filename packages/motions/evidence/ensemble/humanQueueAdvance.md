# src/ensemble/humanQueueAdvance.ts#humanQueueAdvance

## @evidence contracts/development/common.md#meaningful-documentation

Gives the standing geometry, release dependency, bounds, citations and author-owned choices.

## @evidence contracts/development/implementation.md#principled-implementation

Projects standing marks onto the normalized horizontal head-to-exit axis, requires one floor height and compares initial and final adjacent headways with their summed shoulder radii. End-to-start sync uses the fitted duration of each walk in film seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Checks marks before emitting them; HumanEnsemble owns chain construction, HumanCrowd owns the shoulder-disc proxy, and the walk and scheduler own gait and timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The small line tolerance is numerical; delay and marks are authored. No trajectories or empirical reaction constants are baked into the composition.

## @evidence contracts/development/implementation.md#efficient-algorithms

Projection, adjacent checks and chain emission are each linear in the number of members; it keeps one projected distance and one walk per member. Distant pairs are not compared because admitted projected ranks are strictly ordered.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one composition from the current marks and cue; no completed or in-flight requests recur inside this function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No handles, tasks or retained mutable state; the caller owns the returned composition.
