# src/scene/inspection/observeAutoMovieCameraInspection.ts#observeAutoMovieCameraInspection

## @evidence contracts/development/implementation.md#principled-implementation

World bounds classify complete exclusion by a delivery clip plane, then a crossing of a side plane by the outermost corner beyond the same 32-ulp slack. Box overlap and unsupported or unavailable bounds leave the subject ungraded for exact visibility. Actual projection includes the caller's delivery crop. Rigid meshes and owned skins with a stock shader bound the subject through listAutoMovieCameraSubjectMeshes and boundAutoMovieCameraSubject, so an animated actor is graded by its current pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

The framing path visits only target descendants, uses cached rigid geometry bounds and the skin's pose cache, and checks at most ten support points. The optional witness pass runs for possible and side-crossing subjects and is skipped for excluded subjects, unmeasured bounds, and exact pixel observations.

## @evidence contracts/development/common.md#meaningful-documentation

Documents original-frame ownership, projected bounds, and the optional triangle cap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the target, bound it, classify the six clip planes and then side crossings, optionally sample witnesses, then delegate grading to classifyAutoMovieCameraInspection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hidden target, missing bounds or a nonfinite projection or plane is reported unavailable rather than graded, and box overlap never counts as visible.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses cached rigid geometry bounds and the skin's pose cache through the subject bound owner, and takes exact pixel observations instead of rays when a capture supplies them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only per-call matrices, bounds and a frustum, borrows the scene and keeps nothing.
