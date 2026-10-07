import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { decodePng } from "../../../common/mesh/decodePng";
import { HUMAN_FACE_IRIS_EDGE } from "./HUMAN_FACE_IRIS_EDGE";
import { locateHumanFaceIrisDisc } from "./locateHumanFaceIrisDisc";
import { rasterizeHumanFaceIrisTexels } from "./rasterizeHumanFaceIrisTexels";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisPreparedTexture } from "./structures/IHumanFaceIrisPreparedTexture";

/** Width of the sclera ring averaged outside the painted iris, radians. */
const SCLERA_BAND = (2 * Math.PI) / 180;

/**
 * Decode each globe texture once and rasterize every eye painted on it.
 *
 * Globes sharing a material share one decoded image. For each eye the iris
 * disc is located on its neutral globe, the texels within the disc (plus the
 * anti-aliased edge and the sclera ring) are rasterized, and the mean linear
 * sclera colour of the ring just outside the painted iris is recorded. Results
 * are keyed by material ID; the globes are read only.
 *
 * @evidence contracts/common.md#principled-implementation Decoding and rasterization depend only on the neutral globe, so they run once and every pigment reuses them.
 * @evidence contracts/common.md#clear-and-simple-design One preparation stage from globes to decoded textures with their prepared eyes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sclera colour is averaged from the texture itself; no colour is chosen per asset.
 * @evidence contracts/common.md#meaningful-documentation States the sharing rule, the raster margin, the sclera average and the result key.
 * @evidence contracts/modeling.md#spatial-conventions Disc lengths are basis metres, angles radians and texels row-major pixel indices; the sclera mean is linear RGB.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The stage prepares textures and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels prepareHumanFaceIrisTextures defines and consumes no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry prepareHumanFaceIrisTextures emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries prepareHumanFaceIrisTextures builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The painted texture is observed under the pigment rule that consumes prepareHumanFaceIrisTextures's result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source prepareHumanFaceIrisTextures carries basis geometry and texture, not an anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range prepareHumanFaceIrisTextures admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority prepareHumanFaceIrisTextures defines no input through which a caller shapes a face.
 * @author Samchon
 */
export function prepareHumanFaceIrisTextures(
  globes: readonly IHumanFaceIrisGlobe[],
): Map<string, IHumanFaceIrisPreparedTexture> {
  const byMaterial = new Map<string, IHumanFaceIrisPreparedTexture>();
  for (const globe of globes) {
    let texture = byMaterial.get(globe.material);
    if (texture === undefined) {
      texture = { ...decodePng(globe.texture), eyes: [] };
      byMaterial.set(globe.material, texture);
    }
    const disc = locateHumanFaceIrisDisc(globe.positions);
    const reach = Math.max(disc.limbus, disc.painted);
    const texels = rasterizeHumanFaceIrisTexels({
      width: texture.width,
      height: texture.height,
      triangles: globe.triangles,
      disc,
      margin: reach - disc.limbus + HUMAN_FACE_IRIS_EDGE + SCLERA_BAND,
    });
    // The sclera just outside the painted iris, averaged in linear colour.
    const sum = [0, 0, 0];
    let count = 0;
    texels.index.forEach((index, at) => {
      if (texels.theta[at] <= disc.painted + HUMAN_FACE_IRIS_EDGE) return;
      for (let c = 0; c < 3; ++c)
        sum[c] += srgbByteToLinear(texture!.rgba[4 * index + c]);
      ++count;
    });
    texture.eyes.push({
      eye: globe.eye,
      disc,
      texels,
      sclera: (count === 0 ? [1, 1, 1] : sum.map((value) => value / count)) as [
        number,
        number,
        number,
      ],
    });
  }
  return byMaterial;
}
