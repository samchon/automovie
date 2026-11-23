# src/film/computeModelRestExtent.ts#computeModelRestExtent

## @evidence contracts/development/implementation.md#principled-implementation

A running axis-aligned min and max over every vertex after the renderer's placement, part TRS then the bone's composed rest frame at unit scale; it relies on model validation having bound every `attachedBone` to a bone of the model's own skeleton, so a part found on no frame is one that rides no bone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes canonical geometry realization, placeTransformedPoint for the part transform that nodeSubjectBox also applies, and skeletonRestFrames for the bone frames computeRestHeight reads, and owns only the bound accumulation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No model, part kind or bone is special-cased; an empty model answers null by the stated rule instead of a stand-in box, and the subject-height default belongs to the callers.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit, the per-vertex placement order and its sources, the partial-triple rule, the vertical reading, why the horizontal extent matters, the null case and the throwing case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn vertex count V plus one O(B) rest-frame walk for B bones and one tessellation per primitive part; the bounds stream in constant extra space rather than collecting placed points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure measurement of one model that coordinates nothing across calls; a pass that frames the same model for many subjects owns any memoization.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; each tessellation and the rest-frame map are dropped as the call proceeds, and the caller owns the two returned vectors.
