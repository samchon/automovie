import type {
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { portraitNormals } from "../../face/mesh/portraitNormals";
import { HUMAN_BODY_SKIN_DETAIL } from "../constants/HUMAN_BODY_SKIN_DETAIL";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import { humanBodySimpleShapeMath } from "../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinDetailTexture } from "./createHumanBodySkinDetailTexture";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";

/**
 * Compile body skin normal detail and the basis's skin overlays.
 *
 * One generated microtexture and its median UV repeat count are cached per
 * basis revision. Each document's copied skin material receives a strength
 * modulated by its age channel, the optional source anatomical relief, and
 * its declared nail and vein overlays when detail is enabled. Vein visibility
 * reads tissue depth
 * along the rest skin normal against the same lean body used by gravity sag;
 * the builder supplies both lazily for this document. Overlays follow the
 * skin material's authored UVs and do not move skin geometry. The basis and
 * document remain read only; only the fresh material copy is changed.
 * `HUMAN_BODY_SKIN_DETAIL` owns the measured line, pore and age inputs
 * (Hashimoto 1974, Otberg et al. 2004, Li et al. 2006). The palm albedo
 * applied to nails comes from the group-level cheek-to-palm fit in
 * `HUMAN_BODY_SKIN_SITES` (Lu et al. 2025); it is not an individual nail-bed
 * measurement. The basis declares vein attenuation in inverse metres; this
 * appearance rule does not infer vessel depth from anatomical imaging.
 * Local UV stretch is not corrected by the median repeat count. The existing
 * detail gate also means a vein request alone does not attach an overlay.
 */
export function createHumanBodySkinDetail(basis: IAutoMovieHumanBodyBasis) {
  let relief: { texture: string; turns: number } | null = null;
  return (input: {
    document: IAutoMovieHumanBodyBasisDocument;
    materialMap: Map<string, IAutoMovieMaterial>;
    restAll: () => ReturnType<typeof evaluateHumanBodyShape>;
    leanOf: (index: number) => number[];
  }): void => {
    const { document, materialMap, restAll, leanOf } = input;
    if (
      document.skinVeins !== undefined &&
      !(document.skinVeins.strength >= 0 && document.skinVeins.strength <= 1)
    )
      throw new Error("Body skin veins need a strength in [0,1].");
    const detail = document.skinDetail;
    if (detail === undefined) return;
    const skin = HUMAN_BODY_SKIN_SITES.material;
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
  };
}
