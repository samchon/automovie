import {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { paintAutoMovieHumanSkinFeatures } from "./paintAutoMovieHumanSkinFeatures";
import { paintAutoMovieHumanSkinRelief } from "./paintAutoMovieHumanSkinRelief";
import { tintAutoMovieHumanSkin } from "./tintAutoMovieHumanSkin";

/**
 * The skin's material from the identity's pigmentation and the appearance's surface finish, with the images it samples.
 *
 * - Colour: per-vertex albedo from the melanin, eumelanin share and haemoglobin fractions with the regional variation of {@link tintAutoMovieHumanSkin}, over a white base colour.
 * - Specular: a dielectric of refractive index 1.4, so normal-incidence reflectance is 0.028, with a white specular colour, as d'Eon and Luebke recommend for skin (2007, GPU Gems 3, chapter 14). The viewer uses GGX perceptual roughness sqrt(0.35), whose square is its GGX alpha parameter 0.35. Donner and Jensen (2006, Eurographics Symposium on Rendering) instead use Beckmann slope 0.35; equal numeric parameters do not establish equivalent distributions or reflectance. Oiliness scales this implementation's specular intensity from half to full without changing roughness. These choices are conventional and have not been calibrated to measured skin reflectance.
 * - Translucency: the viewer's subsurface approximation with the per-channel radii of d'Eon and Luebke's six-Gaussian skin profile, its weighted standard deviations 1.18, 0.26 and 0.16 mm for red, green and blue (derived from the published variances and weights).
 * - Micro-relief: the actual-footprint mean normal atlas of {@link paintAutoMovieHumanSkinRelief} uses physical rest positions instead of repeating a tile in stretched UVs. Wrinkles deepen the inherited cellular height convention; unresolved normal variance, anatomical crease direction and clinical pore statistics remain unsupported.
 * - Marks: {@link paintAutoMovieHumanSkinFeatures} integrates a seeded rest-space field into the actual atlas. Freckles use one replacement color overlay; acne uses a separate replacement color/normal overlay with its own alpha. Source role metadata excludes glabrous, vermilion, oral and uncertain domains from these ordinary features. It supplies no clinical facial distribution. Ambiguous or collapsed UV regions remain unsupported; finite texture filtering and normal composition remain approximations. Papules change normal shading only.
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
  /** Matching source roles; Human passes them to its cached bakers. Omission on direct uncached calls retains uniform engineering eligibility. */
  domains?: ReadonlyMap<string, IAutoMovieHumanSkinDomain>;
  /** Instance-owned baked features; omitted, compute them here; null is an explicitly disabled field. */
  features?: paintAutoMovieHumanSkinFeatures.IOutput | null;
  /** Instance-owned physical normal atlas; omitted generates it here, while null explicitly disables baking and binding. Returned image records are copied. */
  relief?: IAutoMovieImage | null;
}): {
  parts: IAutoMovieModelPart[];
  material: IAutoMovieMaterial;
  images: IAutoMovieImage[];
} {
  const relief: IAutoMovieImage | null =
    props.relief === undefined
      ? paintAutoMovieHumanSkinRelief({
          parts: props.parts,
          domains: props.domains,
          furrows: props.skin.wrinkles,
        }).image
      : props.relief;
  const features: paintAutoMovieHumanSkinFeatures.IOutput | null =
    props.features === undefined
      ? paintAutoMovieHumanSkinFeatures({
          parts: props.parts,
          domains: props.domains,
          skin: props.skin,
          pigmentation: props.measurements.identity.pigmentation,
        })
      : props.features;
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
      detailNormalTexture:
        relief === null ? null : featureTexture(relief.id, "linear"),
      detailNormalScale: relief === null ? 0 : 1,
      ...(features === null
        ? {}
        : {
            overlays: features.layers.map(
              (
                layer: paintAutoMovieHumanSkinFeatures.ILayer,
              ): IAutoMovieMaterialOverlay => ({
                blend: "replace" as const,
                baseColorTexture: featureTexture(layer.color.id, "srgb"),
                normalTexture:
                  layer.normal === null
                    ? null
                    : featureTexture(layer.normal.id, "linear"),
                normalScale: 1,
                strength: 1,
              }),
            ),
          }),
    },
    images: [
      ...(relief === null ? [] : [{ ...relief }]),
      ...(features === null
        ? []
        : features.layers.flatMap(
            (
              layer: paintAutoMovieHumanSkinFeatures.ILayer,
            ): IAutoMovieImage[] => [
              { ...layer.color },
              ...(layer.normal === null ? [] : [{ ...layer.normal }]),
            ],
          )),
    ],
  };
}

/** Full-atlas bindings carry no repeat transform; replacement normals obey color alpha coverage. */
function featureTexture(
  asset: string,
  colorSpace: "srgb" | "linear",
): IAutoMovieTextureReference {
  return {
    asset,
    texCoord: 0,
    coordinateSource: "normalized",
    colorSpace,
    sampler: {
      wrapS: "clamp",
      wrapT: "clamp",
      minFilter: "linearMipmapLinear",
      magFilter: "linear",
    },
  };
}

/** Conventional GGX perceptual roughness giving alpha 0.35; it is not calibrated to Donner and Jensen's Beckmann slope of the same number. */
const ROUGHNESS: number = Math.sqrt(0.35);
