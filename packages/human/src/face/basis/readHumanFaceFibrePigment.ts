import type { IAutoMovieMaterial } from "@automovie/interface";

import { srgbByteToLinear } from "../../common/colour/srgbByteToLinear";
import { decodePng } from "../../common/mesh/decodePng";

/**
 * Read licensed card foreground painting for texture-free generated shafts.
 * Alpha weights actual foreground texels without interpreting coverage as a
 * follicle population. The result is linear RGB; an unreadable or empty source
 * refuses instead of introducing a guessed hair colour.
 */
export function readHumanFaceFibrePigment(
  material: IAutoMovieMaterial,
): number[] {
  if (typeof material.baseColorTexture !== "string")
    throw new Error(
      "Numerical fibres need readable source foreground pigment: " +
        material.id,
    );
  const image = decodePng(material.baseColorTexture),
    sum = [0, 0, 0];
  let weight = 0;
  for (let texel = 0; texel < image.width * image.height; texel++) {
    const alpha = image.rgba[4 * texel + 3] / 255;
    if (alpha <= 0) continue;
    weight += alpha;
    for (let channel = 0; channel < 3; channel++)
      sum[channel] += alpha * srgbByteToLinear(image.rgba[4 * texel + channel]);
  }
  if (!(weight > 0))
    throw new Error(
      "Numerical fibres have no source foreground pigment: " + material.id,
    );
  return sum.map((value) => value / weight);
}
