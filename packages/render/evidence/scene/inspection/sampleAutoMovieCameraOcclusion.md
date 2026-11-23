# src/scene/inspection/sampleAutoMovieCameraOcclusion.ts#sampleAutoMovieCameraOcclusion

## @evidence contracts/development/implementation.md#principled-implementation

A witness needs a subject triangle behind a nearer supported opaque triangle along the same delivery ray. The inverse of the actual clip matrix yields each ray; both intersections must survive camera depth clipping. A clear sample requires established coverage of candidate geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most nine rays run after a frustum-box pass adds the admitted triangle counts. An exceeded budget gives no samples. One hit per ray is recorded, independent of the number of triangle intersections along that ray.

## @evidence contracts/development/common.md#meaningful-documentation

Defines rigid-mesh coverage and explains why finite rays give witnesses only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One visible-scene pass admits candidates and charges the budget, then one fixed nine-ray grid records witnesses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported subject mesh, an exceeded budget or no candidate gives no samples, and an unsupported blocker forbids a clear sample instead of being ignored.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each requirement samples its own subject and rays once per observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Computes a missing geometry bounding box only within the budget, borrows the scene and returns fresh counts.
