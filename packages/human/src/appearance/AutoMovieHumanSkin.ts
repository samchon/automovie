import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanSkinAppearance } from "../structures/appearance/IAutoMovieHumanSkinAppearance";
import { AutoMovieHumanNail } from "./AutoMovieHumanNail";
import { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinImage } from "./AutoMovieHumanSkinImage";
import { AutoMovieHumanSkinMarks } from "./AutoMovieHumanSkinMarks";
import { AutoMovieHumanSkinPigment } from "./AutoMovieHumanSkinPigment";
import { AutoMovieHumanSkinTone } from "./AutoMovieHumanSkinTone";
import type { AutoMovieHumanVermilion } from "./AutoMovieHumanVermilion";

/**
 * The skin's parts, material and images: the generated skin pieces dressed
 * with texture coordinates, per-vertex albedo and relief weights, and one
 * physically based material that samples the shared micro-relief tile.
 *
 * - Colour: vertex colours from `AutoMovieHumanSkinTone` (the person's
 *   chromophores with regional and mottled multipliers) over a white base
 *   colour, times the tile's faint grain image.
 * - Relief: the tile's normal map through `AutoMovieHumanSkinChart`
 *   coordinates in model metres (`surface-metres`, one tile per
 *   {@link AutoMovieHumanSkinImage.tile} mm), scaled per vertex by the relief
 *   weights and overall by `0.4 + 0.9 wrinkles`.
 * - Specular: a dielectric of index 1.4 (normal-incidence reflectance about
 *   0.028, after d'Eon and Luebke 2007), specular intensity
 *   `min(1, 0.7 + 0.6 oiliness)` and perceptual roughness
 *   `0.55 - 0.15 oiliness`, multiplied by the tile's roughness image, plus a
 *   sheen lobe of a quarter of the person's albedo at roughness 0.6 for the
 *   soft grazing glow of vellus hair. These follow the oiliness parameter's
 *   direction but are not calibrated to measured skin reflectance.
 * - Translucency: the viewer's subsurface approximation with the weighted
 *   per-channel deviations of d'Eon and Luebke's six-Gaussian skin profile,
 *   1.18, 0.26 and 0.16 mm for red, green and blue. That approximation
 *   changes direct light only, so a warm emission of 12, 7.5 and 5 percent
 *   of the person's albedo in red, green and blue stands in for the light
 *   skin returns from under its surface in shadow; it is an appearance
 *   convention, not a measured transport, and it scales with the tone.
 *
 * Inputs: `pigmentation.{melanin, eumelaninShare, haemoglobin}`, and
 * `appearance.skin.{oiliness, wrinkles, seed}`. An omitted `pigmentation`
 * uses melanin 0.008, eumelanin share 0.6 and haemoglobin 0.01, a fair,
 * lightly pigmented convention for an unspecified input rather than an
 * inference about the person; an omitted skin appearance uses oiliness 0.3,
 * wrinkles 0 and seed 0. Freckles and acne are not yet drawn.
 */
export namespace AutoMovieHumanSkin {
  /** Inputs of the skin dressing. */
  export interface IProps {
    /** Shared exterior lip boundary, prepared once with the construction output. */
    vermilion: AutoMovieHumanVermilion.IBoundary;
    /** Complete public input. */
    params: IAutoMovieHumanParameters;

    /** Skin pieces split from the whole skin, in calibration mm. */
    pieces: readonly AutoMovieHumanSkinChart.IPiece[];

    /** Eye globes in calibration mm. */
    eyes: readonly AutoMovieHumanSkinTone.IEye[];

    /** Skin openings of the calibration in mm, for the cavity shading. */
    apertures: readonly IAutoMovieHumanLoftAperture[];

    /** Stature of the calibration body in mm. */
    stature: number;

    /** Millimetre-to-model factor including the stature scale. */
    scale: number;
  }

  /** Dressed skin. */
  export interface IOutput {
    /** `human.skin.<chain>/<k>` and `human.nail.<side>.<digit>` parts in model metres. */
    parts: IAutoMovieModelPart[];

    /** The `human.skin` material and, with digits, the `human.nail` one. */
    materials: IAutoMovieMaterial[];

    /** Images the materials sample. */
    images: IAutoMovieImage[];
  }

  /** Chromophores of an unspecified person; a convention. */
  export const defaultPigmentation: AutoMovieHumanSkinPigment.IChromophores = {
    melanin: 0.008,
    eumelaninShare: 0.6,
    haemoglobin: 0.01,
  };

  /**
   * Dress the skin.
   *
   * @param props Parameters, pieces, eyes and scales
   * @returns Parts, material and images
   */
  export function generate(props: IProps): IOutput {
    const skin: IAutoMovieHumanSkinAppearance | undefined =
      props.params.appearance?.skin;
    const oiliness: number = skin?.oiliness ?? 0.3;
    const pigmentation: AutoMovieHumanSkinPigment.IChromophores =
      props.params.pigmentation ?? defaultPigmentation;
    const wrinkles: number = skin?.wrinkles ?? 0;
    const pieces: AutoMovieHumanSkinChart.IOutput[] =
      AutoMovieHumanSkinChart.generate(props.pieces);
    const tone: AutoMovieHumanSkinTone.IOutput =
      AutoMovieHumanSkinTone.generate({
        vermilion: props.vermilion,
        pieces,
        eyes: props.eyes,
        apertures: props.apertures,
        stature: props.stature,
        pigmentation,
        seed: skin?.seed ?? 0,
      });

    const parts: IAutoMovieModelPart[] = pieces.map(
      (
        piece: AutoMovieHumanSkinChart.IOutput,
        k: number,
      ): IAutoMovieModelPart => ({
        id: "human.skin." + piece.name,
        name: "human.skin." + piece.name,
        geometry: {
          type: "mesh",
          mesh: {
            positions: piece.positions.map(
              (v: number): number => v * props.scale,
            ),
            normals: piece.normals,
            uvs: piece.uvs.map((v: number): number => v * props.scale),
            colors: tone.colors[k]!,
            reliefWeights: tone.reliefWeights[k]!,
            indices: piece.indices,
            skin: null,
          },
        },
        material: "human.skin",
        attachedBone: null,
        transform: null,
      }),
    );

    // One tile per `tile` mm of rest surface; the coordinates are model
    // metres, so the image turns per metre include the stature scale.
    const turns: number = 1 / (AutoMovieHumanSkinImage.tile * props.scale);
    const binding: (
      asset: string,
      colorSpace: "srgb" | "linear",
    ) => IAutoMovieTextureReference = (
      asset: string,
      colorSpace: "srgb" | "linear",
    ): IAutoMovieTextureReference => ({
      asset,
      texCoord: 0,
      coordinateSource: "surface-metres",
      colorSpace,
      transform: {
        offset: { x: 0, y: 0 },
        scale: { x: turns, y: turns },
        rotationDeg: 0,
      },
      sampler: {
        wrapS: "repeat",
        wrapT: "repeat",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    });
    // The person's base albedo scales the two ambient approximations, so a
    // darker tone keeps proportionally darker shadows and sheen.
    const albedo: [number, number, number] =
      AutoMovieHumanSkinPigment.albedo(pigmentation);
    const material: IAutoMovieMaterial = {
      id: "human.skin",
      name: "skin",
      baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
      metallic: 0,
      roughness: 0.55 - 0.15 * oiliness,
      emissive: {
        r: 0.12 * albedo[0],
        g: 0.075 * albedo[1],
        b: 0.05 * albedo[2],
        a: 1,
        hex: null,
      },
      sheen: {
        color: {
          r: 0.25 * albedo[0],
          g: 0.25 * albedo[1],
          b: 0.25 * albedo[2],
          a: 1,
          hex: null,
        },
        roughness: 0.6,
      },
      opacity: 1,
      baseColorTexture: binding(AutoMovieHumanSkinImage.grainId, "srgb"),
      metallicRoughnessTexture: binding(
        AutoMovieHumanSkinImage.glossId,
        "linear",
      ),
      normalTexture: binding(AutoMovieHumanSkinImage.reliefId, "linear"),
      normalScale: 0.4 + 0.9 * wrinkles,
      ior: 1.4,
      specularIntensity: Math.min(1, 0.7 + 0.6 * oiliness),
      subsurfaceRadius: { r: 0.00118, g: 0.00026, b: 0.00016 },
      doubleSided: false,
    };
    const images: IAutoMovieImage[] = AutoMovieHumanSkinImage.generate();

    // Seeded marks multiply the colour through the packed chart layout; the
    // image spans `extent` mm from the origin on both axes.
    const marks: AutoMovieHumanSkinMarks.IOutput | null =
      AutoMovieHumanSkinMarks.generate({
        pieces,
        reliefWeights: tone.reliefWeights,
        stature: props.stature,
        eyes: props.eyes,
        skin,
        pigmentation,
      });
    if (marks !== null) {
      const span: number = 1 / (marks.extent * props.scale);
      material.overlays = [
        {
          baseColorTexture: {
            asset: marks.image.id,
            texCoord: 0,
            coordinateSource: "surface-metres",
            colorSpace: "srgb",
            transform: {
              offset: { x: 0, y: 0 },
              scale: { x: span, y: span },
              rotationDeg: 0,
            },
            sampler: {
              wrapS: "clamp",
              wrapT: "clamp",
              minFilter: "linearMipmapLinear",
              magFilter: "linear",
            },
          },
          blend: "multiply",
          strength: 1,
        },
      ];
      images.push(marks.image);
    }

    const nails: AutoMovieHumanNail.IOutput = AutoMovieHumanNail.generate(
      pieces,
      props.scale,
      albedo,
    );
    return {
      parts: [...parts, ...nails.parts],
      materials:
        nails.material === null ? [material] : [material, nails.material],
      images: [...images, ...nails.images],
    };
  }
}
