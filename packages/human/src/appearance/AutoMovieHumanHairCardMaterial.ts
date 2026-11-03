import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairImage } from "./AutoMovieHumanHairImage";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";

/**
 * Materials `human.hair.cards` and `human.hair.scalp`.
 *
 * Cards: the strand image's luminance times the category colour,
 * alpha-tested at 0.35 coverage (mask needs no sorting and writes depth, at
 * the cost of aliased strand edges), double-sided, the dielectric reflection
 * of keratin at its refractive index {@link KERATIN_IOR} (Marschner et al.
 * 2003, the index their fibre model takes), with an isotropic lobe of
 * roughness 1. A fibre reflects light on a cone about its own axis (Kajiya
 * and Kay 1989): across the fibre its surface normals span the whole half
 * circle, so its highlight is spread over every azimuth and narrow only along
 * the fibre. An isotropic lobe cannot be narrow one way and wide the other;
 * at roughness 0.38 it gathered the spread highlight of the whole mass into
 * one round white spot on the smooth mass normals, which read as shiny bare
 * scalp on the top and side of the head. The widest isotropic lobe is the
 * one that spreads as a fibre does across its axis; the narrow band along the
 * strands needs an anisotropic lobe on a strand tangent continuous across
 * cards. A card's strand direction is the card's own heading,
 * which turns a little from card to card as combed hair does: an anisotropic
 * lobe of strength 0.6 stretched every highlight across the strands and
 * switched it on or off card by card, so the lit side of every cut broke into
 * grey card-shaped planks (the grey blotches over the back and top) and the
 * aligned cards at the back's midline drew a highlight strip. Removing that
 * lobe alone, with geometry, normals and vertex shade unchanged, removed the
 * planks in a controlled render. Conventions pending the optical
 * qualification of #2957. Scalp layer: 55 percent of the colour, roughness
 * 0.85, alpha-blended by its coverage image (`AutoMovieHumanHairScalpLayer`),
 * whose alpha is the share of scalp the hair hides; drawn after the skin and
 * the alpha-masked cards and depth-tested against both.
 */
export namespace AutoMovieHumanHairCardMaterial {
  /** Refractive index of hair keratin (Marschner et al. 2003, measured value their model uses). */
  export const KERATIN_IOR: number = 1.55;

  /**
   * The two materials.
   *
   * @param hair Scalp hair input
   * @param coverage Image id of the scalp layer's coverage
   * @returns The card and scalp layer materials
   */
  export function materials(
    hair: IAutoMovieHumanScalpHair,
    coverage: string,
  ): IAutoMovieMaterial[] {
    const [r, g, b] = AutoMovieHumanHairShade.linear(hair.color);
    return [
      {
        id: "human.hair.cards",
        name: "scalp hair",
        baseColor: { r, g, b, a: 1, hex: null },
        metallic: 0,
        roughness: 1,
        emissive: null,
        opacity: 1,
        baseColorTexture: {
          asset: AutoMovieHumanHairImage.id,
          texCoord: 0,
          colorSpace: "srgb",
          sampler: {
            wrapS: "repeat",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        },
        doubleSided: true,
        alphaMode: "mask",
        alphaCutoff: 0.35,
        ior: KERATIN_IOR,
      },
      {
        id: "human.hair.scalp",
        name: "scalp hair undercoat",
        baseColor: { r: r * 0.55, g: g * 0.55, b: b * 0.55, a: 1, hex: null },
        metallic: 0,
        roughness: 0.85,
        emissive: null,
        opacity: 1,
        baseColorTexture: {
          asset: coverage,
          texCoord: 0,
          colorSpace: "srgb",
          sampler: {
            wrapS: "clamp",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        },
        alphaMode: "blend",
      },
    ];
  }
}
