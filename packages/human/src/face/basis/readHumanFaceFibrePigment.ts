import type { IAutoMovieMaterial } from "@automovie/interface";

import { srgbByteToLinear } from "../../common/colour/srgbByteToLinear";
import { decodePng } from "../../common/mesh/decodePng";
import type { IPngImage as IPngImageImported } from "../../index";

/**
 * Read licensed card foreground painting for texture-free generated shafts.
 * Alpha weights actual foreground texels without interpreting coverage as a
 * follicle population. The result is linear RGB; an unreadable or empty source
 * refuses instead of introducing a guessed hair colour.
 *
 * @evidence contracts/common.md#principled-implementation Decoded licensed PNG foreground contributes alpha-weighted linear RGB, sum(alpha*srgbByteToLinear)/sum(alpha). The existing texture decoder supplies byte layout; colour averaging is a deterministic artwork summary, not follicle density or tissue measurement.
 * @evidence contracts/common.md#clear-and-simple-design Texture decoding and transfer-function conversion stay with their shared owners; this reader owns only the three-channel foreground reduction used by numerical fibre assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing/unreadable texture or zero alpha population refuses. No subject preset, guessed pigment, background threshold or alpha-to-follicle conversion repairs the input.
 * @evidence contracts/common.md#meaningful-documentation Prose gives licensed foreground purpose, alpha weighting, linear output and empty-source refusal; the source material is read without mutation.
 * @evidence contracts/performance.md#efficient-algorithms PNG decode plus one P-texel scan dominates; accumulation needs three scalar sums and decoded pixel bytes. No sorting or repeated decode inside the texel loop occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The image is decoded once for all three channel sums in this call; caching belongs to the source/material consumer because this standalone reader has no immutable-material key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Decoded bytes are local until return; only three RGB numbers transfer, with no retained image cache, file handle or asynchronous job.
 */
export function readHumanFaceFibrePigment(
  material: IAutoMovieMaterial,
): number[] {
  if (typeof material.baseColorTexture !== "string")
    throw new Error(
      "Numerical fibres need readable source foreground pigment: " +
        material.id,
    );
  const image: IPngImageImported = decodePng(material.baseColorTexture),
    sum: number[] = [0, 0, 0];
  let weight: number = 0;
  for (let texel: number = 0; texel < image.width * image.height; texel++) {
    const alpha: number = image.rgba[4 * texel + 3] / 255;
    if (alpha <= 0) continue;
    weight += alpha;
    for (let channel: number = 0; channel < 3; channel++)
      sum[channel] += alpha * srgbByteToLinear(image.rgba[4 * texel + channel]);
  }
  if (!(weight > 0))
    throw new Error(
      "Numerical fibres have no source foreground pigment: " + material.id,
    );
  return sum.map((value: number): number => value / weight);
}
