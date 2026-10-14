import { IAutoMovieSubjectReviewPose } from "@automovie/interface";

/**
 * Retain the existing public inspection name for the shared subject-review camera pose.
 *
 * @evidence contracts/common.md#principled-implementation The shared pose representation carries one model/world coordinate basis and camera/lens values.
 * @evidence contracts/common.md#clear-and-simple-design Inspection and review use the same structure rather than a second camera schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This alias adds no physical admission, renderer or separate film-time meaning.
 * @evidence contracts/common.md#meaningful-documentation Camera coordinates/clip planes use metres and field of view degrees under the shared pose contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pose arithmetic executes in autoMovieSubjectInspectionPose and its box helpers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared pose type aligns capture and review joins but caches no camera computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned pose records remain with plans/observations; this erased alias acquires no camera handle.
 *
 * @author Samchon
 */
export type IAutoMovieSubjectInspectionPose = IAutoMovieSubjectReviewPose;
