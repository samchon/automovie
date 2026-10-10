import type { IAutoMovieMaterial } from "@automovie/interface";

import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { decodePng } from "../../../common/mesh/decodePng";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";

/**
 * Average licensed gingival painting at resident non-crown triangle corners.
 * The source UVs identify artwork rather than a biological pigmentation
 * measurement. The current material gain remains independent of geometry.
 * Missing gum painting refuses rather than choosing an anatomical colour.
 * @author Samchon
 */
export function readHumanFaceOralPigment(
  basis: IAutoMovieHumanFaceBasis,
  material: IAutoMovieMaterial,
): number[] {
  const surface = basis.surfaces.find((one) => one.id === "Human.teeth_base")!;
  const crownVertices = new Set(
    readHumanFaceOralCrowns(basis).flatMap((crown) => crown.vertices),
  );
  const total = [0, 0, 0];
  let samples = 0;
  if (material.baseColorTexture === null)
    return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
  if (typeof material.baseColorTexture !== "string")
    throw new Error(
      "Oral source painting needs a directly readable source texture: " +
        material.id,
    );
  const image = decodePng(material.baseColorTexture);
  for (const region of surface.regions) {
    if (region.material !== material.id || region.uvs === null) continue;
    for (let at = 0; at < region.indices.length; at += 3) {
      if (
        region.indices
          .slice(at, at + 3)
          .some((vertex) => crownVertices.has(vertex))
      )
        continue;
      for (let k = 0; k < 3; k++) {
        const u = region.uvs[2 * (at + k)],
          v = region.uvs[2 * (at + k) + 1];
        const x = Math.floor((((u % 1) + 1) % 1) * image.width);
        const y = Math.min(
          image.height - 1,
          Math.floor((1 - (((v % 1) + 1) % 1)) * image.height),
        );
        for (let axis = 0; axis < 3; axis++)
          total[axis] += srgbByteToLinear(
            image.rgba[4 * (y * image.width + x) + axis],
          );
        samples++;
      }
    }
  }
  if (samples === 0)
    throw new Error(
      "Oral lining needs source gingival painting outside registered crowns.",
    );
  return total.map(
    (value, axis) =>
      (value / samples) *
      [material.baseColor.r, material.baseColor.g, material.baseColor.b][axis],
  );
}
