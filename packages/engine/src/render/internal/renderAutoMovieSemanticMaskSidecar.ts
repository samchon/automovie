import { IAutoMovieSemanticMask } from "@automovie/interface";

import { canonicalAutoMovieSemanticMaskPayload } from "./canonicalAutoMovieSemanticMaskPayload";
import { verifyAutoMovieSemanticMask } from "./verifyAutoMovieSemanticMask";

/*
 * Serialize one mask as the sidecar that travels beside the pixels: pretty
 * JSON, declared field order, one trailing newline.
 *
 * A mask frame is unreadable on its own. `#0A1B2C` is a door leaf only because
 * this document says so, so the palette has to leave the renderer with the
 * frames rather than be re-derived by whoever opens them later; a consumer that
 * re-derived it from a design that has since moved on would read yesterday's
 * colours off today's pixels. The bytes are the same convention the caption and
 * pose-keypoint sidecars use, so a host writes all three the same way.
 */
export function renderAutoMovieSemanticMaskSidecar(
  mask: IAutoMovieSemanticMask,
): string {
  verifyAutoMovieSemanticMask(mask);
  return `${JSON.stringify(
    { ...canonicalAutoMovieSemanticMaskPayload(mask), digest: mask.digest },
    null,
    2,
  )}\n`;
}
