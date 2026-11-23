# src/film/computeModelRestExtentY.ts#computeModelRestExtentY

## @evidence contracts/development/implementation.md#principled-implementation

Projects computeModelRestExtent's portable part/proxy box onto Y using the same part placement and tessellation as its width measurement; external appearance bytes and renderer-only deformation are not measured here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A named one-axis view for `formationMemberExtent` and the public height readers, which need only a height and would otherwise restate the projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no model; null passes through unchanged instead of becoming a default height, which `formationMemberExtent` and the subject readers apply.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and axis, why a joint span is the wrong height with the stickman ratio, and the null and throwing cases it inherits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant projection work to one computeModelRestExtent call over supplied part vertices and rig rest frames; no second vertex traversal is made for Y.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure projection of one model's measurement that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the three-axis box is dropped on return and the caller owns the two numbers.
