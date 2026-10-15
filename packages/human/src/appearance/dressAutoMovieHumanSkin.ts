import { IAutoMovieImage, IAutoMovieMaterial } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { paintAutoMovieHumanSkinRelief } from "./paintAutoMovieHumanSkinRelief";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";

/**
 * The skin's material from the identity's pigmentation and the appearance's surface finish, with the images it samples.
 *
 * - Colour: the diffuse albedo {@link pigmentAutoMovieHumanSkin} computes from the melanin, eumelanin share and haemoglobin fractions.
 * - Specular: a dielectric of refractive index 1.4, so normal-incidence reflectance is 0.028, with a white specular colour, as d'Eon and Luebke recommend for skin (2007, GPU Gems 3, chapter 14). Roughness 0.59 is the viewer's perceptual roughness whose square is the Beckmann slope 0.35 Donner and Jensen use for all skin (2006, Eurographics Symposium on Rendering); oiliness then scales the specular intensity from half at dry to full at oily skin, their way of controlling oil without changing roughness. Grade: conventional.
 * - Translucency: the viewer's subsurface approximation with the per-channel radii of d'Eon and Luebke's six-Gaussian skin profile, its weighted standard deviations 1.18, 0.26 and 0.16 mm for red, green and blue (derived from the published variances and weights).
 * - Micro-relief: the pore and furrow normal map of {@link paintAutoMovieHumanSkinRelief}, tiled at its physical size as the detail normal over the published UV layout. The layout spends one texel density on every part, about {@link ATLAS_SPAN} metres of skin per atlas width, so one repeat count holds the tile's physical size everywhere to within a chart's stretch.
 *
 * The material id stays `skin`, the id the skin parts cite; the relief image's id names its content.
 *
 * @param props.pigmentation The identity's pigmentation
 * @param props.skin The appearance's skin finish
 * @returns The material and the images it samples
 */
export function dressAutoMovieHumanSkin(props: {
  pigmentation: IAutoMovieHumanIdentity.IPigmentation;
  skin: IAutoMovieHumanAppearance.ISkin;
}): { material: IAutoMovieMaterial; images: IAutoMovieImage[] } {
  const albedo: { r: number; g: number; b: number } = pigmentAutoMovieHumanSkin(
    props.pigmentation,
  );
  const relief: IAutoMovieImage = paintAutoMovieHumanSkinRelief({ furrows: 0.5 });
  const repeats: number = ATLAS_SPAN / paintAutoMovieHumanSkinRelief.TILE;
  return {
    material: {
      id: "skin",
      name: `skin, layout v${AUTOMOVIE_HUMAN_UV_LAYOUT.version}`,
      baseColor: { ...albedo, a: null, hex: null },
      metallic: 0,
      roughness: ROUGHNESS,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
      ior: 1.4,
      specularIntensity: 0.5 + 0.5 * props.skin.oiliness,
      subsurfaceRadius: { r: 0.00118, g: 0.00026, b: 0.00016 },
      detailNormalTexture: {
        asset: relief.id,
        texCoord: 0,
        coordinateSource: "normalized",
        colorSpace: "linear",
        transform: {
          offset: { x: 0, y: 0 },
          scale: { x: repeats, y: repeats },
          rotationDeg: 0,
        },
        sampler: {
          wrapS: "repeat",
          wrapT: "repeat",
          minFilter: "linearMipmapLinear",
          magFilter: "linear",
        },
      },
      detailNormalScale: 1,
    },
    images: [relief],
  };
}

/** Perceptual roughness whose square is the Beckmann slope 0.35 of Donner and Jensen (2006). */
const ROUGHNESS: number = Math.sqrt(0.35);

/** Metres of skin across one atlas width of the published UV layout, as the layout documents. */
const ATLAS_SPAN: number = 1.8;
