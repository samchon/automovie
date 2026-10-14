import { IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import { canonicalizeAutoMovieJson, digestAutoMovieBytes } from "./contentIdentity";
import { IAutoMovieSubjectInspectionPose } from "./IAutoMovieSubjectInspectionPose";

/**
 * Digest the canonical ordered v2 plan and its complete context fields.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON includes production, target, revision, compile fingerprint, ordered viewpoints/poses and false delivery lane before byte hashing.
 * @evidence contracts/common.md#clear-and-simple-design Publisher and parsed-plan admission share this exact identity representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest proves represented plan-byte agreement, not valid physical viewpoints, immutable caller objects or visible coverage.
 * @evidence contracts/common.md#meaningful-documentation Order matters and the returned digest belongs to one exact v2 context.
 * @evidence contracts/performance.md#efficient-algorithms Canonical traversal, key ordering, JSON/UTF8 allocation and SHA work scale with the full plan representation.
 * @evidence contracts/performance.md#reuse-equivalent-work The same serializer/hash owner is reused by publish and reopen; each changed plan is recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical objects/text/bytes are temporary; only the digest escapes and no plan snapshot cache is retained.
 */
export function autoMovieSubjectInspectionPlanIdentity(
  props: {
  productionId: string;
  target: IAutoMovieSubjectReviewTarget;
  revision: string;
  compileFingerprint: string;
  planned: readonly IAutoMovieSubjectReviewViewpoint[];
  poses: readonly IAutoMovieSubjectInspectionPose[];
}
): string { return digestAutoMovieBytes(
    Buffer.from(
      canonicalizeAutoMovieJson({
        version: 2,
        productionId: props.productionId,
        target: props.target,
        revision: props.revision,
        compileFingerprint: props.compileFingerprint,
        planned: props.planned,
        poses: props.poses,
        deliveryEvidence: false,
      }),
      "utf8",
    ),
  ); }
