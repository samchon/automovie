import type { IAutoMovieMaterial } from "@automovie/interface";

import { decodePortraitPng } from "../mesh/decodePortraitPng";
import { encodePortraitPng } from "../mesh/encodePortraitPng";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Compile the shared fibre pigment rule: the colour and density of the hair
 * a brow or lash card paints.
 *
 * A connected basis draws brows and lashes as cards whose base-colour
 * texture holds the fibres, their coverage in the alpha channel (cut by a
 * mask or blended) and one source colour in RGB, so every document shared
 * the source's dark brown fibres and its density, and a material colour
 * override can only darken that texture further. A document's material
 * override may now carry `pigment`, the fibres' linear RGB albedo, and
 * `density`, a factor on their coverage.
 *
 * For a pigment, each covered texel (alpha above zero) keeps its luminance
 * relative to the coverage-weighted mean luminance of all covered texels,
 * which is the texture's own fibre-to-fibre and root-to-tip variation, and
 * takes the pigment times that ratio, held to [0,1]; the material's
 * base-colour factor becomes white so the pigment is not multiplied again.
 * For a density, each texel's coverage is multiplied by it and held to one,
 * so a factor below one thins the fibres under the material's own cutoff and
 * one above one fills them. Colour is computed in linear RGB and encoded as
 * 8-bit sRGB; uncovered texels and every other material are unchanged.
 *
 * Textures are decoded once per material and the last result is cached by
 * the requested values, so replay of the same document reuses the same
 * bytes. Omission leaves the material byte for byte. It refuses a pigment
 * component or density outside its range and a material that does not carry
 * an embedded PNG with coverage (alpha mode mask or blend). The pigment is an
 * authored optical value under the renderer's light, not a reflectance
 * recovered from a photograph.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Makes brow and lash fibre colour and density authored values painted by one rule on the shared cards.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Expresses brow and lash differences as numerical material values over the common basis textures instead of personal images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-fibre Repaints covered texels from the pigment and the texture's own luminance ratio and scales coverage by the density.
 */
export function createHumanFaceFibrePigment(): (
  overrides: IAutoMovieHumanFaceBasisDocument["materials"],
  materials: IAutoMovieMaterial[],
) => void {
  const decoded = new Map<string, IDecodedFibres>();
  const painted = new Map<string, { key: string; uri: string }>();
  return (overrides, materials) => {
    for (const [id, override] of Object.entries(overrides ?? {})) {
      if (override.pigment === undefined && override.density === undefined)
        continue;
      const material = materials.find((one) => one.id === id);
      if (
        (override.pigment !== undefined &&
          !override.pigment.every((value) => value >= 0 && value <= 1)) ||
        (override.density !== undefined &&
          !(override.density >= 0 && override.density <= 4))
      )
        throw new Error(
          "Fibre pigment needs linear components in [0,1] and a density in [0,4].",
        );
      if (
        material === undefined ||
        typeof material.baseColorTexture !== "string" ||
        (material.alphaMode !== "mask" && material.alphaMode !== "blend")
      )
        throw new Error(
          "Fibre pigment needs a material whose embedded texture carries coverage: " +
            id,
        );
      const key = JSON.stringify([override.pigment, override.density]);
      let result = painted.get(id);
      if (result?.key !== key) {
        let source = decoded.get(id);
        if (source === undefined) {
          source = decode(material.baseColorTexture);
          decoded.set(id, source);
        }
        result = {
          key,
          uri: paint(source, override.pigment, override.density),
        };
        painted.set(id, result);
      }
      material.baseColorTexture = result.uri;
      if (override.pigment !== undefined)
        material.baseColor = {
          ...material.baseColor,
          r: 1,
          g: 1,
          b: 1,
          hex: null,
        };
    }
  };
}

/** A decoded fibre texture and the coverage-weighted mean luminance. */
interface IDecodedFibres {
  width: number;
  height: number;
  rgba: Uint8Array;
  mean: number;
}

function decode(uri: string): IDecodedFibres {
  const image = decodePortraitPng(uri);
  let weighted = 0;
  let coverage = 0;
  for (let texel = 0; texel < image.width * image.height; ++texel) {
    const alpha = image.rgba[4 * texel + 3]! / 255;
    if (alpha === 0) continue;
    weighted += alpha * luminance(image.rgba, texel);
    coverage += alpha;
  }
  return { ...image, mean: coverage === 0 ? 0 : weighted / coverage };
}

function paint(
  source: IDecodedFibres,
  pigment: [number, number, number] | undefined,
  density: number | undefined,
): string {
  const rgba = source.rgba.slice();
  for (let texel = 0; texel < source.width * source.height; ++texel) {
    const alpha = rgba[4 * texel + 3]!;
    if (alpha === 0) continue;
    if (pigment !== undefined) {
      const ratio =
        source.mean === 0 ? 1 : luminance(source.rgba, texel) / source.mean;
      for (let c = 0; c < 3; ++c)
        rgba[4 * texel + c] = toByte(Math.min(1, pigment[c]! * ratio));
    }
    if (density !== undefined)
      rgba[4 * texel + 3] = Math.min(255, Math.round(alpha * density));
  }
  return encodePortraitPng({
    width: source.width,
    height: source.height,
    rgba,
  });
}

function luminance(rgba: Uint8Array, texel: number): number {
  return (
    0.2126 * toLinear(rgba[4 * texel]!) +
    0.7152 * toLinear(rgba[4 * texel + 1]!) +
    0.0722 * toLinear(rgba[4 * texel + 2]!)
  );
}

function toLinear(byte: number): number {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toByte(linear: number): number {
  const c =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}
