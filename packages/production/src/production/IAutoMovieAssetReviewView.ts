import type { IAutoMovieAssetTurntableView } from "@automovie/interface";

/**
 * Required asset-review target direction, pose and pass without a frame observation.
 *
 * @evidence contracts/common.md#principled-implementation Omits only frame from the retained IAutoMovieAssetTurntableView shape, preserving the descriptor's ID, angles, pose and pass for review target addressing.
 * @evidence contracts/common.md#clear-and-simple-design autoMovieAssetReviewViews supplies this shape to assetReviewEvidenceDiagnostics, which asks its providers for current target fingerprints and resident pass observations. This type supplies no capture implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A frame-free descriptor is a required observation address, not admitted captured evidence; resident receipt and byte validation remain with the supplied reader's owner.
 * @evidence contracts/common.md#meaningful-documentation Describes the actual review coverage role and retained receipt-shape relationship; descriptor membership alone proves neither frame provenance nor visual approval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased shape chooses no camera, parser or renderer algorithm; factory allocation and review-provider work belong to their runtime owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The descriptor type stores no equivalent-frame or currentness cache; the review's runtime providers reobserve the requested target and resident evidence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callers own descriptor arrays, and this shape owns no pixel buffer, host handle or running capture task.
 * @author Samchon
 */
export type IAutoMovieAssetReviewView = Omit<IAutoMovieAssetTurntableView, "frame">;
