import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./structures/IHumanFaceIrisTexels";

import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { decodePng } from "../../../common/mesh/decodePng";
import { HUMAN_FACE_IRIS_EDGE } from "./HUMAN_FACE_IRIS_EDGE";
import { locateHumanFaceIrisDisc } from "./locateHumanFaceIrisDisc";
import { rasterizeHumanFaceIrisTexels } from "./rasterizeHumanFaceIrisTexels";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisPreparedTexture } from "./structures/IHumanFaceIrisPreparedTexture";

/** Width of the sclera ring averaged outside the painted iris, radians. */
const SCLERA_BAND: number = (2 * Math.PI) / 180;

/**
 * Decode each globe texture once and rasterize every eye painted on it.
 *
 * Globes sharing a material share one decoded image. For each eye the iris
 * disc is located on its neutral globe, the texels within the disc (plus the
 * anti-aliased edge and the sclera ring) are rasterized, and the mean linear
 * sclera colour of the ring just outside the painted iris is recorded. Results
 * are keyed by material ID; the globes are read only.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Neutral geometry locates each eye's polar disc; actual UV rasterization supplies iris texels and mean linear sclera ring colour.
 * @evidence contracts/common.md#clear-and-simple-design Material IDs own decoded texture sharing while geometry and colour conversion retain canonical helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty sampled ring uses the explicit white display fallback; it supplies no measured missing sclera reflectance.
 * @evidence contracts/common.md#meaningful-documentation The prose states one decode per material, neutral eye geometry and source immutability.
 * @evidence contracts/performance.md#efficient-algorithms PNG decode, globe fit, per-triangle raster boxes and selected ring texel scans dominate, including source image dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work Globes sharing an admitted material reuse one decoded RGBA image; each selected eye retains its own disc/raster correspondence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned preparation owns decoded images and eye tables until builder release; no independent image-size cap or external handle is introduced.
 */
export function prepareHumanFaceIrisTextures(
  globes: readonly IHumanFaceIrisGlobe[],
): Map<string, IHumanFaceIrisPreparedTexture> {
  const byMaterial: Map<string, IHumanFaceIrisPreparedTexture> = new Map<string, IHumanFaceIrisPreparedTexture>();
  for (const globe of globes) {
    let texture: IHumanFaceIrisPreparedTexture | undefined = byMaterial.get(globe.material);
    if (texture === undefined) {
      texture = { ...decodePng(globe.texture), eyes: [] };
      byMaterial.set(globe.material, texture);
    }
    const disc: IHumanFaceIrisDisc = locateHumanFaceIrisDisc(globe.positions);
    const reach: number = Math.max(disc.limbus, disc.painted);
    const texels: IHumanFaceIrisTexels = rasterizeHumanFaceIrisTexels({
      width: texture.width,
      height: texture.height,
      triangles: globe.triangles,
      disc,
      margin: reach - disc.limbus + HUMAN_FACE_IRIS_EDGE + SCLERA_BAND,
    });
    // The sclera just outside the painted iris, averaged in linear colour.
    const sum: number[] = [0, 0, 0];
    let count: number = 0;
    texels.index.forEach((index: number, at: number): void  => {
      if (texels.theta[at] <= disc.painted + HUMAN_FACE_IRIS_EDGE) return;
      for (let c: number = 0; c < 3; ++c)
        sum[c] += srgbByteToLinear(texture!.rgba[4 * index + c]);
      ++count;
    });
    texture.eyes.push({
      eye: globe.eye,
      disc,
      texels,
      sclera: (count === 0 ? [1, 1, 1] : sum.map((value: number): number  => value / count)) as [
        number,
        number,
        number,
      ],
    });
  }
  return byMaterial;
}
