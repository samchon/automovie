import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanBrowAppearance } from "../structures/appearance/IAutoMovieHumanBrowAppearance";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";

/**
 * Brow material `human.hair.brows.<side>`: the brow's colour, roughness 0.5
 * and specular intensity 0.5, double-sided (conventions of this prototype).
 */
export namespace AutoMovieHumanEyebrowMaterial {
  /**
   * The material of one brow.
   *
   * @param brow Brow input, for its colour
   * @param side Eye side, which names the material
   * @returns The material
   */
  export function material(
    brow: IAutoMovieHumanBrowAppearance,
    side: "left" | "right",
  ): IAutoMovieMaterial {
    const [r, g, b]: [number, number, number] = AutoMovieHumanHairShade.linear(
      brow.color,
    );
    return {
      id: `human.hair.brows.${side}`,
      name: "eyebrows",
      baseColor: { r, g, b, a: 1, hex: null },
      metallic: 0,
      roughness: 0.5,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      doubleSided: true,
      specularIntensity: 0.5,
    };
  }
}
