import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Read a neutral head-metre point's signed part-plane side using tanh of signed distance divided by transition width. Combing and scalp tint share this scalar convention, but that does not certify their rendered boundaries coincide. Far arguments may round to plus or minus one. Inputs remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Normalized plane normal and signed offset produce a tanh side across the authored transition width.
 * @evidence contracts/common.md#clear-and-simple-design Combing and scalp occupancy share one static plane-side convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This shared scalar does not prove agreement of the actual rendered ribbon edge with the tint edge; far values can round to plus/minus one.
 * @evidence contracts/common.md#meaningful-documentation Offsets and transition widths are metres and the input point remains in the neutral head frame.
 * @evidence contracts/performance.md#efficient-algorithms A vector normalization, dot product and tanh take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work One plane rule is reused by directional and occupancy consumers, without per-input memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes; caller part records and vectors remain unchanged.
 */
export function humanFaceHairPartSide(
  point: IAutoMovieVector3,
  part: Pick<
    NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>,
    "normal" | "offset" | "transitionWidth"
  >,
): number {
  const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.create(...part.normal));
  return Math.tanh(
    (Vector3.dot(point, axis) - part.offset) / part.transitionWidth,
  );
}
