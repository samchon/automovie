import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairPartSide } from "./humanFaceHairPartSide";

/**
 * The share of the scalp at a neutral metre-space point that a parting leaves bare of fibres, in [0, 1]: the parting's region envelope times one minus the magnitude of its side. The combing field sends hair on the two sides of the plane away from it in proportion to the side's magnitude, so the hair rooted on the plane itself stays put and the hair rooted a transition width away has already left; the scalp the field uncovers is therefore widest on the plane, narrows through the transition and is gone beyond it, and nothing is uncovered outside the region the document limits the parting to.
 *
 * This is a model of where the field removes fibres, as the hair builder's own combing does, and not a sample of the rendered ribbons: nearby roots, the tip of the lock and curl move the real edge. It exists so a consumer can show the scalp's own colour along a parting instead of the colour of hair that is not there. Nothing is changed.
 *
 * @evidence contracts/common.md#principled-implementation Gaussian region weight times one minus absolute part-side estimates the scalp area left bare by a static part field.
 * @evidence contracts/common.md#clear-and-simple-design Scalp tint uses this proxy while actual curve and ribbon construction remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This does not sample rendered ribbon coverage, and curl, neighbouring roots or tips can change the visible boundary.
 * @evidence contracts/common.md#meaningful-documentation Head-metre positions and admitted part fields produce a dimensionless weight in the numerical unit interval.
 * @evidence contracts/performance.md#efficient-algorithms One envelope and one signed-side evaluation take fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same part-side formula drives desired combing and tint occupancy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar estimate escapes and no mesh or visibility history is retained.
 */
export function humanFaceHairPartOccupancy(
  point: IAutoMovieVector3,
  part: NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>,
): number {
  return (
    humanFaceHairEnvelope(point, part.region) *
    (1 - Math.abs(humanFaceHairPartSide(point, part)))
  );
}
