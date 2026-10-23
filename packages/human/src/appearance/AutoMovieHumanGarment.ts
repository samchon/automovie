import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IAutoMovieHumanUnderwear } from "../structures/appearance/IAutoMovieHumanUnderwear";
import { AutoMovieHumanLowerUnderwear } from "../typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../typings/AutoMovieHumanUpperUnderwear";
import { AutoMovieHumanGarmentBody } from "./AutoMovieHumanGarmentBody";
import { AutoMovieHumanGarmentPattern } from "./AutoMovieHumanGarmentPattern";
import { AutoMovieHumanGarmentShell } from "./AutoMovieHumanGarmentShell";

/**
 * Basic underwear: tight garments cut from the generated skin and inflated
 * over it (see `packages/human/docs/techniques/garments.md`).
 *
 * Each requested garment is one part, `human.garment.<id>` with `id` in
 * `briefs`, `boxerBriefs` and `bra`, citing the one material
 * `human.garment.fabric`. The garment never changes the skin parts: it is a
 * separate shell a fabric thickness above them, so a viewer can hide every
 * `human.garment.` part and see the body unchanged.
 *
 * `underwear.bottom` and `underwear.top` choose the patterns
 * ({@link AutoMovieHumanGarmentPattern}); `none` emits nothing for that
 * garment. `underwear.color` is the fabric's sRGB colour.
 */
export namespace AutoMovieHumanGarment {
  /** Garment parts and their material. */
  export interface IOutput {
    /** One part per requested garment, model metres. */
    parts: IAutoMovieModelPart[];

    /** The fabric material, absent when no garment is emitted. */
    materials: IAutoMovieMaterial[];
  }

  /** Material id every garment part cites. */
  export const MATERIAL: string = "human.garment.fabric";

  /**
   * Dress one generated body.
   *
   * @param underwear Underwear choice, or undefined for none
   * @param parts Generated body parts in model metres; skin is read only
   * @returns Garment parts and material, empty when nothing is requested
   */
  export function generate(
    underwear: IAutoMovieHumanUnderwear | undefined,
    parts: readonly IAutoMovieModelPart[],
  ): IOutput {
    if (
      underwear === undefined ||
      (underwear.bottom === AutoMovieHumanLowerUnderwear.None &&
        underwear.top === AutoMovieHumanUpperUnderwear.None)
    )
      return { parts: [], materials: [] };
    const body: AutoMovieHumanGarmentBody.IBody | null =
      AutoMovieHumanGarmentBody.create(parts);
    if (body === null) return { parts: [], materials: [] };

    const out: IAutoMovieModelPart[] = [];
    for (const pattern of AutoMovieHumanGarmentPattern.create(
      underwear.bottom,
      underwear.top,
      body.landmarks,
    )) {
      const mesh: IAutoMovieMesh | null = AutoMovieHumanGarmentShell.generate(
        body,
        pattern,
      );
      if (mesh === null) continue;
      out.push({
        id: "human.garment." + pattern.id,
        name: "human.garment." + pattern.id,
        geometry: { type: "mesh", mesh },
        material: MATERIAL,
        attachedBone: null,
        transform: null,
      });
    }
    return {
      parts: out,
      materials: out.length === 0 ? [] : [fabric(underwear.color)],
    };
  }

  /**
   * Matte knit fabric of one sRGB colour.
   *
   * Roughness 0.9 and specular intensity 0.35 keep the weak, broad
   * reflection of cotton or microfibre knit; a sheen lobe of the colour
   * lightened halfway to white, roughness 0.7, adds the soft grazing glow of
   * the fibre pile. Both are appearance conventions, not measured values.
   * Double-sided, so a grazing view past the hem lip never shows a hole.
   */
  function fabric(color: string): IAutoMovieMaterial {
    const [r, g, b] = [1, 3, 5].map((i: number): number =>
      linear(parseInt(color.slice(i, i + 2), 16) / 255),
    ) as [number, number, number];
    return {
      id: MATERIAL,
      name: "underwear fabric",
      baseColor: { r, g, b, a: 1, hex: null },
      metallic: 0,
      roughness: 0.9,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      doubleSided: true,
      specularIntensity: 0.35,
      sheen: {
        color: {
          r: (r + 1) / 2,
          g: (g + 1) / 2,
          b: (b + 1) / 2,
          a: null,
          hex: null,
        },
        roughness: 0.7,
      },
    };
  }

  /** The sRGB transfer function inverted: one encoded channel to linear. */
  function linear(c: number): number {
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
}
