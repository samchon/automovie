import type {
  IAutoMovieMaterial,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { HUMAN_BODY_SKIN_DETAIL } from "../../constants/HUMAN_BODY_SKIN_DETAIL";
import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import { humanBodySimpleShapeMath } from "../../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinDetailTexture } from "./createHumanBodySkinDetailTexture";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";

/**
 * Compile the body skin's optional micro-normal detail.
 *
 * One generated microtexture and its median UV repeat count are cached per
 * basis revision. Each document's copied skin material receives a strength
 * modulated by its age channel and the optional source anatomical relief.
 * `HUMAN_BODY_SKIN_DETAIL` owns the measured line, pore and age inputs
 * (Hashimoto 1974, Otberg et al. 2004, Li et al. 2006). The body basis and
 * document remain read only; only the fresh material copy is changed.
 * Local UV stretch is not corrected by the median repeat count. Nail and
 * vein overlays have their own owner and remain visible without this stage.
 */
export function createHumanBodySkinDetail(basis: IAutoMovieHumanBodyBasis) {
  let relief: { texture: string; turns: number } | null = null;
  return (input: {
    document: IAutoMovieHumanBodyBasisDocument;
    materialMap: Map<string, IAutoMovieMaterial>;
  }): void => {
    const { document, materialMap } = input;
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
  };
}
