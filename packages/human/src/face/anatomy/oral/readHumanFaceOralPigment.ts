import type { IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IHumanFaceOralCrown as ImportedIHumanFaceOralCrown, IPngImage as ImportedIPngImage } from "@automovie/human";
import type { IAutoMovieMaterial } from "@automovie/interface";

import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { decodePng } from "../../../common/mesh/decodePng";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";

/**
 * Read licensed gingival artwork at non-crown triangle corners, wrap source UVs to resident PNG texels, average their linear RGB and apply the material gain. This is source appearance rather than biological pigmentation measurement. An untextured material returns its base colour; a textured material without eligible gum samples refuses. No image or topology cache is retained by this reader.
 *
 * @evidence contracts/common.md#principled-implementation Licensed non-crown triangle-corner UV texels average linear source colour, multiplied by the resident material gain.
 * @evidence contracts/common.md#clear-and-simple-design Artwork sampling supplies appearance while source crown registration excludes enamel corners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clinical pigment is inferred; missing textured gum samples refuse, while an untextured material explicitly returns its base colour.
 * @evidence contracts/common.md#meaningful-documentation UVs wrap to resident PNG texels and sRGB bytes convert through the shared linear-colour owner.
 * @evidence contracts/performance.md#efficient-algorithms Source crown extraction and PNG decode add topology/byte/pixel work before the matching triangle-corner sample scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared decoder and colour conversion are reused, but this reader currently repeats extraction/decode on each call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Decoded raster, crown set and colour totals are call-local with no global image cache; only three returned colour values escape.
 *
 * @author Samchon
 */
export function readHumanFaceOralPigment(
  basis: IAutoMovieHumanFaceBasis,
  material: IAutoMovieMaterial,
): number[] {
  const surface: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces.find((one: ImportedIAutoMovieHumanFaceBasisSurface): boolean => one.id === "Human.teeth_base")!;
  const crownVertices: Set<number> = new Set(
    readHumanFaceOralCrowns(basis).flatMap((crown: ImportedIHumanFaceOralCrown): number[] => crown.vertices),
  );
  const total: number[] = [0, 0, 0];
  let samples: number = 0;
  if (material.baseColorTexture === null)
    return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
  if (typeof material.baseColorTexture !== "string")
    throw new Error(
      "Oral source painting needs a directly readable source texture: " +
        material.id,
    );
  const image: ImportedIPngImage = decodePng(material.baseColorTexture);
  for (const region of surface.regions) {
    if (region.material !== material.id || region.uvs === null) continue;
    for (let at: number = 0; at < region.indices.length; at += 3) {
      if (
        region.indices
          .slice(at, at + 3)
          .some((vertex: number): boolean => crownVertices.has(vertex))
      )
        continue;
      for (let k: number = 0; k < 3; k++) {
        const u: number = region.uvs[2 * (at + k)],
          v: number = region.uvs[2 * (at + k) + 1];
        const x: number = Math.floor((((u % 1) + 1) % 1) * image.width);
        const y: number = Math.min(
          image.height - 1,
          Math.floor((1 - (((v % 1) + 1) % 1)) * image.height),
        );
        for (let axis: number = 0; axis < 3; axis++)
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
    (value: number, axis: number): number =>
      (value / samples) *
      [material.baseColor.r, material.baseColor.g, material.baseColor.b][axis],
  );
}
