import { IAutoMovieSemanticMask } from "@automovie/interface";

import { canonicalAutoMovieSemanticMaskPayload } from "./canonicalAutoMovieSemanticMaskPayload";
import { verifyAutoMovieSemanticMask } from "./verifyAutoMovieSemanticMask";

/**
 * Serialize one mask as the sidecar that travels beside the pixels: pretty
 * JSON, declared field order, one trailing newline.
 *
 * A mask frame is unreadable on its own. `#0A1B2C` is a door leaf only because
 * this document says so, so the palette has to leave the renderer with the
 * frames rather than be re-derived by whoever opens them later; a consumer that
 * re-derived it from a design that has since moved on would read yesterday's
 * colours off today's pixels. The bytes are the same convention the caption and
 * pose-keypoint sidecars use, so a host writes all three the same way.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Verify the current mask schema/digest, project through the shared complete canonical payload and pretty-print explicit field order with exactly one trailing newline.
 * @evidence contracts/common.md#clear-and-simple-design Verification owns runtime refusal, canonicalAutoMovieSemanticMaskPayload owns field/order identity and this function owns portable sidecar formatting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied sealed palette travels with its pixels rather than being rederived from a newer design; no field is silently discarded to serialize a malformed current-schema payload.
 * @evidence contracts/common.md#meaningful-documentation Docs describe readable JSON, newline convention, complete semantic ownership and refusal before serialization; the serializer owns no destination path.
 * @evidence contracts/performance.md#efficient-algorithms Verification hashes B payload bytes, then projection/sorting and pretty encoding produce O(B) output with proportional temporary storage; validation and serialization currently project separately.
 * @evidence contracts/performance.md#reuse-equivalent-work Hash and sidecar share the canonical projection law; no mutable payload cache is retained and the serializer does not skip revalidation by trusting a prior digest string.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned text and writes/releases any file; projected objects/bytes are call-local and no file handle or renderer task is opened.
 */
export const renderAutoMovieSemanticMaskSidecar: (
  mask: IAutoMovieSemanticMask,
) => string = (mask: IAutoMovieSemanticMask): string => {
  verifyAutoMovieSemanticMask(mask);
  return `${JSON.stringify(
    { ...canonicalAutoMovieSemanticMaskPayload(mask), digest: mask.digest },
    null,
    2,
  )}\n`;
};
