import type { IAutoMovieMaterial } from "@automovie/interface";

import { linearToSrgbByte } from "../../common/colour/linearToSrgbByte";
import { srgbByteToLinear } from "../../common/colour/srgbByteToLinear";
import { decodePng } from "../../common/mesh/decodePng";
import { encodePng } from "../../common/mesh/encodePng";
import type { IPngImage as IPngImageImported } from "../../index";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceMaterialOverride as IAutoMovieHumanFaceMaterialOverrideImported } from "../structures/IAutoMovieHumanFaceMaterialOverride";

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
 * For a pigment, the reference is the median luminance of the texels the
 * card draws (coverage at or above its mask cutoff, every covered texel for
 * a blended card), the typical fibre. Each covered texel takes the pigment
 * times its luminance over that reference, held at one: a darker texel keeps
 * its shade (the card's own fibre-to-fibre and root-to-tip variation), while
 * the source's brighter texels, which are coverage fringes whose colour bled
 * from the authoring background, are painted at the pigment itself rather
 * than lighter than any fibre. The material's base-colour factor becomes
 * white so the pigment is not multiplied again.
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
 * The builder supplies fresh copies of one fixed basis palette. Reusing this painter with a changed PNG or cutoff under the same material id is outside that premise. Earlier current-build materials may already be painted if a later override fails; no previously published model is passed here.
 *
 * @evidence contracts/common.md#principled-implementation Linear luminance and the drawn-texel median preserve source shade below the requested pigment while alpha is multiplied by the admitted density gain. The builder's fixed PNG/cutoff palette supplies cache identity; source-black reference uses unit ratio, and sRGB byte quantization limits optical precision.
 * @evidence contracts/common.md#clear-and-simple-design One painter owns decoded source and latest per-material PNGs; small decode, paint and luminance functions separate source coverage analysis from document optical edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The bright-fringe ratio cap, mask cutoff and density [0,4] are explicit painting conventions, not follicle counts or recovered reflectance. Missing registered coverage and out-of-range values refuse; omission preserves the supplied material and no source photograph is consulted.
 * @evidence contracts/common.md#meaningful-documentation Prose gives linear/sRGB and alpha meanings, median/fringe conventions, omission/refusal behavior, fixed-palette cache premise and partial current-build mutation on later failure.
 * @evidence contracts/performance.md#efficient-algorithms For P texels decoding scans and sorts D drawn luminances in O(P+D log D), and each changed paint scans P before PNG compression; material lookup scans the fixed palette for each override. Equal requests reuse PNG bytes instead of repeating pixel work.
 * @evidence contracts/performance.md#reuse-equivalent-work Decoded images are keyed by material id and painted outputs by that id plus pigment/density. This is valid for the builder's immutable source PNG and cutoff, not an arbitrary changing palette under reused ids; material base colour is set independently on the current clone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder-owned closure retains one decoded image and latest PNG per touched source material until release; its fixed palette bounds ids and images. The standalone painter has no eviction or byte cap for an expanding id population and acquires no GPU/task handle.
 */
export function createHumanFaceFibrePigment(): (
  overrides: IAutoMovieHumanFaceBasisDocument["materials"],
  materials: IAutoMovieMaterial[],
) => void {
  const decoded: Map<string, IDecodedFibres> = new Map<
    string,
    IDecodedFibres
  >();
  const painted: Map<string, { key: string; uri: string }> = new Map<
    string,
    { key: string; uri: string }
  >();
  return (
    overrides:
      | Record<string, IAutoMovieHumanFaceMaterialOverrideImported>
      | undefined,
    materials: IAutoMovieMaterial[],
  ): void => {
    for (const [id, override] of Object.entries(overrides ?? {})) {
      if (override.pigment === undefined && override.density === undefined)
        continue;
      const material: IAutoMovieMaterial | undefined = materials.find(
        (one: IAutoMovieMaterial): boolean => one.id === id,
      );
      if (
        (override.pigment !== undefined &&
          !override.pigment.every(
            (value: number): boolean => value >= 0 && value <= 1,
          )) ||
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
      const key: string = JSON.stringify([override.pigment, override.density]);
      let result: { key: string; uri: string } | undefined = painted.get(id);
      if (result?.key !== key) {
        let source: IDecodedFibres | undefined = decoded.get(id);
        if (source === undefined) {
          source = decode(
            material.baseColorTexture,
            material.alphaMode === "mask" ? (material.alphaCutoff ?? 0.5) : 0,
          );
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

/** A decoded fibre texture and the median luminance of its drawn texels. */
interface IDecodedFibres {
  width: number;
  height: number;
  rgba: Uint8Array;
  reference: number;
}

function decode(uri: string, cutoff: number): IDecodedFibres {
  const image: IPngImageImported = decodePng(uri);
  const drawn: number[] = [];
  for (let texel: number = 0; texel < image.width * image.height; ++texel) {
    const alpha: number = image.rgba[4 * texel + 3]! / 255;
    if (alpha > 0 && alpha >= cutoff) drawn.push(luminance(image.rgba, texel));
  }
  drawn.sort((a: number, b: number): number => a - b);
  return {
    ...image,
    reference: drawn.length === 0 ? 0 : drawn[Math.floor(drawn.length / 2)]!,
  };
}

function paint(
  source: IDecodedFibres,
  pigment: [number, number, number] | undefined,
  density: number | undefined,
): string {
  const rgba: Uint8Array<ArrayBuffer> = source.rgba.slice();
  for (let texel: number = 0; texel < source.width * source.height; ++texel) {
    const alpha: number = rgba[4 * texel + 3]!;
    if (alpha === 0) continue;
    if (pigment !== undefined) {
      const ratio: number =
        source.reference === 0
          ? 1
          : Math.min(1, luminance(source.rgba, texel) / source.reference);
      for (let c: number = 0; c < 3; ++c)
        rgba[4 * texel + c] = linearToSrgbByte(pigment[c]! * ratio);
    }
    if (density !== undefined)
      rgba[4 * texel + 3] = Math.min(255, Math.round(alpha * density));
  }
  return encodePng({
    width: source.width,
    height: source.height,
    rgba,
  });
}

function luminance(rgba: Uint8Array, texel: number): number {
  return (
    0.2126 * srgbByteToLinear(rgba[4 * texel]!) +
    0.7152 * srgbByteToLinear(rgba[4 * texel + 1]!) +
    0.0722 * srgbByteToLinear(rgba[4 * texel + 2]!)
  );
}
