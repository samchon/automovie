/**
 * Compile the body's material and skin finish stage over one admitted basis.
 * Its lazy site-colour and texture caches belong to that basis revision; each
 * document receives fresh materials, while rest-shape and lean-shape values
 * are supplied by the builder that owns their evaluation order. The stage
 * applies material overrides, anatomical site colour, scattering, relief,
 * overlays and chromophore tone before geometry is split into material parts.
 * It neither moves skin vertices nor mutates the basis or document.
 */
import type {
  IAutoMovieJointPose,
  IAutoMovieMaterialOverlay,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { portraitNormals } from "../../face/mesh/portraitNormals";
import { HUMAN_BODY_SKIN_DETAIL } from "../constants/HUMAN_BODY_SKIN_DETAIL";
import { HUMAN_BODY_SKIN_SCATTERING } from "../constants/HUMAN_BODY_SKIN_SCATTERING";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import { humanBodySimpleShapeMath } from "../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinColour } from "./createHumanBodySkinColour";
import { createHumanBodySkinDetailTexture } from "./createHumanBodySkinDetailTexture";
import { createHumanBodySkinTone } from "./createHumanBodySkinTone";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";

/**
 * Resolve one document's material copies and per-surface colour multipliers.
 * Skin maps are made only on first use and then reused for later documents on
 * the same basis. The body builder owns rest and lean evaluation so veins and
 * sag read identical shaped positions when both are requested.
 * Source UVs determine physical tile scale in metres; maps carry their own
 * linear or sRGB colour space. The copied material array is new per document,
 * and only the texture bytes and site weights remain cached across documents.
 */
export function createHumanBodyAppearance(basis: IAutoMovieHumanBodyBasis) {
  // Read the site weights from the basis only when the first cheek asks for them.
  let siteColour: ReturnType<typeof createHumanBodySkinColour> | null = null;
  let relief: { texture: string; turns: number } | null = null;
  const tone = createHumanBodySkinTone(basis);
  return (input: {
    document: IAutoMovieHumanBodyBasisDocument;
    pose: readonly IAutoMovieJointPose[];
    restAll: () => ReturnType<typeof evaluateHumanBodyShape>;
    leanOf: (index: number) => number[];
  }) => {
    const { document, pose, restAll, leanOf } = input;
    const materials = structuredClone(basis.materials);
    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material = materialMap.get(id);
      const values = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value) => !Number.isFinite(value) || value < 0 || value > 1,
        )
      )
        throw new Error(
          "Body material overrides need existing IDs and finite [0,1] values.",
        );
      if (override.color !== undefined)
        material.baseColor = {
          ...material.baseColor,
          ...override.color,
          hex: null,
        };
      if (override.roughness !== undefined)
        material.roughness = override.roughness;
    }
    // the skin's colour by site, from the cheek the face wears: the material
    // takes the largest albedo and its regions the multipliers of it
    const skin = HUMAN_BODY_SKIN_SITES.material;
    // skin is translucent: its material carries the measured scattering
    // distance, which a renderer blurs the diffuse response over
    if (materialMap.has(skin))
      materialMap.get(skin)!.subsurfaceRadius = {
        ...HUMAN_BODY_SKIN_SCATTERING,
      };
    const cheek = document.skinColour?.cheek;
    if (
      cheek !== undefined &&
      (!materialMap.has(skin) ||
        document.materials?.[skin]?.color !== undefined ||
        [cheek.r, cheek.g, cheek.b].some((value) => value <= 0 || value > 1))
    )
      throw new Error(
        "Body skin colour needs a skin material without a colour override and a cheek albedo in (0,1].",
      );
    const coloured =
      cheek === undefined
        ? null
        : (siteColour ??= createHumanBodySkinColour(basis))(
            [cheek.r, cheek.g, cheek.b],
            // the skin over a joint lightens as the coupled pose folds it
            (bone) =>
              pose.find((row) => row.bone === bone)?.flexion ?? null,
          );
    if (coloured !== null) {
      const [r, g, b] = coloured.base;
      materialMap.get(skin)!.baseColor = {
        ...materialMap.get(skin)!.baseColor,
        r,
        g,
        b,
        hex: null,
      };
    }
    if (
      document.skinVeins !== undefined &&
      !(document.skinVeins.strength >= 0 && document.skinVeins.strength <= 1)
    )
      throw new Error("Body skin veins need a strength in [0,1].");
    // the skin's micro-relief as a tiled normal map, deepening with age
    const detail = document.skinDetail;
    if (detail !== undefined) {
      if (
        !materialMap.has(skin) ||
        !(detail.strength >= 0 && detail.strength <= 1) ||
        basis.surfaces.some((surface) =>
          surface.regions.some(
            (region) => region.material === skin && region.uvs === null,
          ),
        )
      )
        throw new Error(
          "Body skin detail needs a skin material on textured regions and a strength in [0,1].",
        );
      relief ??= {
        texture: createHumanBodySkinDetailTexture(HUMAN_BODY_SKIN_DETAIL),
        turns:
          humanBodySkinMetresPerUv(basis, skin) /
          (HUMAN_BODY_SKIN_DETAIL.tileMillimetres / 1000),
      };
      const material = materialMap.get(skin)!;
      const tile: IAutoMovieTextureReference = {
        asset: relief.texture,
        texCoord: 0,
        coordinateSource: "source-uv",
        colorSpace: "linear",
        transform: {
          offset: { x: 0, y: 0 },
          scale: { x: relief.turns, y: relief.turns },
          rotationDeg: 0,
        },
        sampler: {
          wrapS: "repeat",
          wrapT: "repeat",
          minFilter: "linearMipmapLinear",
          magFilter: "linear",
        },
      };
      const deepening = humanBodySimpleShapeMath.curve(
        HUMAN_BODY_SKIN_DETAIL.age,
        document.shape.macroAge ?? 0,
      );
      // the surface's anatomical relief, where the basis has one, carries the
      // creases under the tiled micro-relief, which becomes its detail
      const anatomical = basis.surfaces.find(
        (surface) => surface.relief?.material === skin,
      )?.relief;
      if (anatomical !== undefined) {
        material.normalTexture = {
          asset: anatomical.texture,
          texCoord: 0,
          coordinateSource: "source-uv",
          colorSpace: "linear",
          sampler: {
            wrapS: "clamp",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        };
        material.normalScale = detail.strength * deepening;
        material.detailNormalTexture = tile;
        material.detailNormalScale = detail.strength * deepening;
      } else {
        material.normalTexture = tile;
        material.normalScale = detail.strength * deepening;
      }
      // the surface layers the basis lays over the skin: the nail plates, a
      // tissue of their own that replaces the skin where they cover
      const once = (asset: string, colorSpace: "srgb" | "linear") => ({
        asset,
        texCoord: 0,
        coordinateSource: "source-uv" as const,
        colorSpace,
        sampler: {
          wrapS: "clamp" as const,
          wrapT: "clamp" as const,
          minFilter: "linearMipmapLinear" as const,
          magFilter: "linear" as const,
        },
      });
      // the veins show over the lean body the surface's sag declares, and
      // the tissue the body carries over its lean self hides them as a
      // deeper vein takes less of the light
      const restNormals = new Map<number, number[]>();
      const veinsShow = (
        index: number,
        overlay: { vertices: number[]; attenuation: number },
        strength: number,
      ): number => {
        const surface = basis.surfaces[index];
        const rest = restAll().surfaces[index];
        const lean = leanOf(index);
        let normals = restNormals.get(index);
        if (normals === undefined) {
          normals = portraitNormals(rest, surface.indices);
          restNormals.set(index, normals);
        }
        let tissue = 0;
        for (const v of overlay.vertices) {
          let along = 0;
          for (let k = 0; k < 3; k++)
            along += (rest[v * 3 + k] - lean[v * 3 + k]) * normals[v * 3 + k];
          tissue += Math.max(0, along);
        }
        return (
          strength *
          Math.exp((-overlay.attenuation * tissue) / overlay.vertices.length)
        );
      };
      const overlays = basis.surfaces.flatMap((surface, index) =>
        (surface.overlays ?? [])
          .filter((overlay) => overlay.material === skin)
          .flatMap((overlay): IAutoMovieMaterialOverlay[] => {
            const normalTexture =
              overlay.normal === undefined
                ? null
                : once(overlay.normal, "linear");
            if (overlay.kind === "nails") {
              // the nail bed follows the person's pigmentation as the palm,
              // the skin's least pigmented site, does
              const cheek = document.skinColour?.cheek;
              const palm = (rgb: { r: number; g: number; b: number }) =>
                HUMAN_BODY_SKIN_SITES.sites.palmar.map(
                  ([a, b], k) => Math.exp(a) * [rgb.r, rgb.g, rgb.b][k] ** b,
                );
              const factor =
                cheek === undefined || overlay.cheek === undefined
                  ? undefined
                  : ((own, drawn) => ({
                      r: own[0] / drawn[0],
                      g: own[1] / drawn[1],
                      b: own[2] / drawn[2],
                    }))(palm(cheek), palm(overlay.cheek));
              return [
                {
                  baseColorTexture: once(overlay.color, "srgb"),
                  blend: "replace",
                  ...(factor === undefined ? {} : { colorFactor: factor }),
                  roughness: overlay.roughness,
                  normalTexture,
                  strength: 1,
                },
              ];
            }
            const veins = document.skinVeins;
            if (veins === undefined) return [];
            return [
              {
                baseColorTexture: once(overlay.color, "srgb"),
                blend: "multiply",
                normalTexture,
                strength: veinsShow(index, overlay, veins.strength),
              },
            ];
          }),
      );
      if (overlays.length > 0) material.overlays = overlays;
    }
    tone(document, materialMap);
    return { materials, coloured };
  };
}
