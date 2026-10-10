import { clampAutoMovieUnitInterval } from "@automovie/engine/math/clampAutoMovieUnitInterval";
import type { IAutoMovieMaterial } from "@automovie/interface";

import { linearToSrgbByte } from "../../../common/colour/linearToSrgbByte";
import { materialBaseColourRgb } from "../../../common/colour/materialBaseColourRgb";
import { srgbByteToLinear } from "../../../common/colour/srgbByteToLinear";
import { encodePng } from "../../../common/mesh/encodePng";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceIris } from "../../structures/IAutoMovieHumanFaceIris";
import { HUMAN_FACE_IRIS_EDGE } from "./HUMAN_FACE_IRIS_EDGE";
import { createPortraitIrisMaterials } from "./createPortraitIrisMaterials";
import { findHumanFaceIrisGlobe } from "./findHumanFaceIrisGlobe";
import { humanFaceIrisTexelColour } from "./humanFaceIrisTexelColour";
import { prepareHumanFaceIrisTextures } from "./prepareHumanFaceIrisTextures";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisPreparedTexture } from "./structures/IHumanFaceIrisPreparedTexture";

/**
 * Compile the shared iris pigment rule of a connected basis.
 *
 * The basis eye is a globe mesh whose one texture paints sclera, iris and
 * pupil together, so a material colour override can only tint the whole eye
 * and a blue or grey iris cannot be written at all. This rule repaints only
 * the anatomical iris disc of that texture from the document's numerical
 * pigments and leaves every other texel as the basis has it.
 *
 * At compile time each articulated eye (`basis.articulation.eyes`) finds its
 * globe: the triangles of a textured region whose three vertices are bound to
 * that eye with weight one. Their neutral positions are retained for the iris
 * disc (`locateHumanFaceIrisDisc`). Disc admission, texture decoding and its
 * rasterization (`rasterizeHumanFaceIrisTexels`) happen only when a document first carries `iris`,
 * because most documents never pay for it. Per document the texels are
 * painted by `humanFaceIrisTexelColour` and the material's texture is
 * replaced by a new PNG; the last result is cached by its pigments, so replay
 * of the same document reuses the same bytes.
 *
 * The disc is the population's absolute iris on the globe
 * (`locateHumanFaceIrisDisc`); where the texture's own painted iris, drawn in
 * proportion to an oversized globe, reaches beyond it, the rest of that
 * painted iris is covered with the mean sclera colour of the ring just
 * outside it, blended across the painted edge, so no second, darker ring
 * shows around the anatomical iris.
 * The disc's lengths describe the neutral basis. Identity morphs subsequently
 * carry that painted texture with the globe, so this rule does not preserve
 * the same measured iris diameter under a nonrigid identity change. The cache
 * key is pigment only because painting uses that shared neutral geometry.
 *
 * The rule changes no geometry and no other material. Omission or null leaves
 * the materials untouched, byte for byte. It refuses a pigment outside the
 * unit range (through `createPortraitIrisMaterials`), a basis without
 * articulated eyes and an eye without a textured globe. Colours follow the
 * constructed portrait eye's band semantics so one pigment reads the same on
 * both face builders; they are an authored optical approximation, not a
 * recovered reflectance.
 *
 * The returned rule mutates the `materials` array it is handed (the builder's
 * own clone of the basis materials), replacing only the embedded texture of
 * each eye's globe material with a new PNG data URI; the basis and the caller's
 * pigments are never modified. Lengths in the disc geometry are metres in the
 * basis frame, angles are radians, and texture coordinates are pixels.
 * The connected builder may exclude source owners replaced by generated
 * numerical optics. Exclusion changes only legacy painting: both pigment
 * records remain admitted, while an unselected source eye still requires its
 * textured globe. The selected owner population is part of the cache key and
 * preparation is rebuilt when it changes; the caller's set is never retained.
 */
export function createHumanFaceIrisPigment(
  basis: IAutoMovieHumanFaceBasis,
): (
  iris: IAutoMovieHumanFaceIris | null | undefined,
  materials: IAutoMovieMaterial[],
  excludedOwners?: ReadonlySet<string>,
) => void {
  const globes = (basis.articulation?.eyes ?? []).map((eye) => ({
    eye: eye.id,
    globe: findHumanFaceIrisGlobe(basis, eye.id),
  }));
  let prepared: Map<string, IHumanFaceIrisPreparedTexture> | undefined;
  let preparedOwners: string | undefined;
  let cache: { key: string; textures: Map<string, string> } | undefined;
  return (iris, materials, excludedOwners) => {
    if (iris === undefined || iris === null) return;
    const bands: Record<string, [number, number, number][]> = {
      leftEye: createPortraitIrisMaterials("iris", iris.left).map(
        materialBaseColourRgb,
      ),
      rightEye: createPortraitIrisMaterials("iris", iris.right).map(
        materialBaseColourRgb,
      ),
    };
    if (globes.length === 0)
      throw new Error("Iris pigment needs a basis with articulated eyes.");
    const selected = globes.filter(({ eye }) => !excludedOwners?.has(eye));
    const paintable: IHumanFaceIrisGlobe[] = selected.map(({ eye, globe }) => {
      if (bands[eye] === undefined)
        throw new Error(
          "Iris pigment names leftEye and rightEye only, not " + eye + ".",
        );
      if (globe === null)
        throw new Error("Iris pigment needs a textured globe for " + eye + ".");
      return globe;
    });
    const owners = JSON.stringify(selected.map(({ eye }) => eye));
    const key = JSON.stringify([owners, iris.left, iris.right]);
    if (cache?.key !== key) {
      if (preparedOwners !== owners) {
        prepared = prepareHumanFaceIrisTextures(paintable);
        preparedOwners = owners;
      }
      const textures = new Map<string, string>();
      for (const [material, texture] of prepared!) {
        const rgba = texture.rgba.slice();
        for (const { eye, disc, texels, sclera } of texture.eyes)
          texels.index.forEach((index, at) => {
            const theta = texels.theta[at];
            const painted = [0, 1, 2].map((c) =>
              srgbByteToLinear(texture.rgba[4 * index + c]),
            );
            // Under an anatomical disc smaller than the texture's painted
            // iris, the rest of that iris becomes sclera, blended into the
            // painting across its edge.
            const cover =
              disc.painted > disc.limbus
                ? clampAutoMovieUnitInterval(
                    (disc.painted + HUMAN_FACE_IRIS_EDGE - theta) /
                      (2 * HUMAN_FACE_IRIS_EDGE),
                  )
                : 0;
            const original = painted.map(
              (value, c) => value + (sclera[c] - value) * cover,
            );
            const colour = humanFaceIrisTexelColour({
              theta,
              phi: texels.phi[at],
              limbus: disc.limbus,
              pupil: disc.pupil,
              bands: bands[eye],
              edge: HUMAN_FACE_IRIS_EDGE,
              original: original as [number, number, number],
            });
            for (let c = 0; c < 3; ++c)
              rgba[4 * index + c] = linearToSrgbByte(colour[c]);
          });
        textures.set(
          material,
          encodePng({
            width: texture.width,
            height: texture.height,
            rgba,
          }),
        );
      }
      cache = { key, textures };
    }
    for (const [id, uri] of cache.textures)
      materials.find((one) => one.id === id)!.baseColorTexture = uri;
  };
}
