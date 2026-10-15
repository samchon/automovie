import {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { paintAutoMovieHumanSkinRelief } from "./paintAutoMovieHumanSkinRelief";
import { tintAutoMovieHumanSkin } from "./tintAutoMovieHumanSkin";

/**
 * The skin's material from the identity's pigmentation and the appearance's surface finish, with the images it samples.
 *
 * - Colour: per-vertex albedo from the melanin, eumelanin share and haemoglobin fractions with the regional variation of {@link tintAutoMovieHumanSkin}, over a white base colour.
 * - Specular: a dielectric of refractive index 1.4, so normal-incidence reflectance is 0.028, with a white specular colour, as d'Eon and Luebke recommend for skin (2007, GPU Gems 3, chapter 14). Roughness 0.59 is the viewer's perceptual roughness whose square is the Beckmann slope 0.35 Donner and Jensen use for all skin (2006, Eurographics Symposium on Rendering); oiliness then scales the specular intensity from half at dry to full at oily skin, their way of controlling oil without changing roughness. Grade: conventional.
 * - Translucency: the viewer's subsurface approximation with the per-channel radii of d'Eon and Luebke's six-Gaussian skin profile, its weighted standard deviations 1.18, 0.26 and 0.16 mm for red, green and blue (derived from the published variances and weights).
 * - Micro-relief: the pore and furrow normal map of {@link paintAutoMovieHumanSkinRelief}, its furrows as deep as the appearance's wrinkles, tiled at its physical size as the detail normal over the published UV layout. The layout spends one texel density on every part, about {@link ATLAS_SPAN} metres of skin per atlas width, so one repeat count holds the tile's physical size everywhere to within a chart's stretch.
 *
 * The material id stays `skin`, the id the skin parts cite; the relief image's id names its content.
 *
 * @param props.parts The emitted parts; skin parts gain vertex colours
 * @param props.measurements Resolved measurements
 * @param props.skeleton The skeleton at rest
 * @param props.skin The appearance's skin finish
 * @returns The parts, the material and the images it samples
 */
export function dressAutoMovieHumanSkin(props: {
  parts: readonly IAutoMovieModelPart[];
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  skin: IAutoMovieHumanAppearance.ISkin;
}): {
  parts: IAutoMovieModelPart[];
  material: IAutoMovieMaterial;
  images: IAutoMovieImage[];
} {
  const relief: IAutoMovieImage = paintAutoMovieHumanSkinRelief({
    furrows: props.skin.wrinkles,
  });
  const repeats: number = ATLAS_SPAN / paintAutoMovieHumanSkinRelief.TILE;
  return {
    parts: tintAutoMovieHumanSkin({
      parts: props.parts,
      measurements: props.measurements,
      skeleton: props.skeleton,
    }),
    material: {
      id: "skin",
      name: `skin, layout v${AUTOMOVIE_HUMAN_UV_LAYOUT.version}`,
      baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
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
      detailNormalScale: 0.6,
    },
    images: [relief],
  };
}

/** Perceptual roughness whose square is the Beckmann slope 0.35 of Donner and Jensen (2006). */
const ROUGHNESS: number = Math.sqrt(0.35);

/** Metres of skin across one atlas width of the published UV layout, as the layout documents. */
const ATLAS_SPAN: number = 1.8;
