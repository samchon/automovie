# src/film/formationSubjectBox.ts#formationSubjectBox

## @evidence contracts/development/implementation.md#principled-implementation

Moves the exact slot bounds by the sampled cue through the builder's corner transform, then takes the Minkowski sum with each member's horizontal radius and vertical extent, which bounds every member whose body stays within that radius of its slot, the radius the compiler derives as representative for the model group.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the builder's `sampleFormationMotion` and `transformFormationBounds` with the member extent its caller measured, so `performShot` and `realizeShotContract` frame and grade a unit from one box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no formation; the negative-time and negative-radius floors keep a sample on the unit's defined range rather than special-casing a caller.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit, why the cue is sampled through the builder's functions, the negative-time reading, and how and why the footprint is widened and raised.

## @evidence contracts/development/implementation.md#efficient-algorithms

One cue sample, linear in the shot's cues with a sort of this unit's cues, plus a fixed eight-corner transform; independent of the member count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one unit at one instant; the framing passes that sample a unit repeatedly own any reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned box.
