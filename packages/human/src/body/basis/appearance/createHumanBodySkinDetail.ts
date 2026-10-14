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
 * One generated microtexture and its area-weighted median UV repeat count are cached per basis revision. Each document's copied skin material receives a strength modulated by its age channel and the optional source anatomical relief. `HUMAN_BODY_SKIN_DETAIL` owns the authored line, pore and age inputs (Hashimoto 1974, Otberg et al. 2004, Li et al. 2006). The body basis and document remain read only; only the fresh material copy is changed. Local UV stretch is not corrected by the median repeat count. Nail and vein overlays have their own owner and remain visible without this stage. The admitted basis and fixed detail table must remain unchanged while using this closure; it retains its generated URI until the caller releases it.
 *
 * @evidence contracts/common.md#principled-implementation Textured skin regions and strength in [0,1] precede deterministic microtexture generation; area-weighted UV scale and authored age response map physical tile lengths into copied material normal fields.
 * @evidence contracts/common.md#clear-and-simple-design One optional detail closure owns its lazy texture/repeat cache while anatomical relief, overlays and fresh material copies retain their existing responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Median repeat cannot correct local UV stretch, and authored age/detail relations cannot certify personal micro-relief or biological aging.
 * @evidence contracts/common.md#meaningful-documentation The prose gives unchanged-basis/table cache premises, optional omission, physical repeat units and mutation confined to supplied material copies.
 * @evidence contracts/performance.md#efficient-algorithms Each use scans source regions for UV admission and relief selection; first use adds source UV area measurement and pixel/pore texture synthesis, while later calls reuse the generated URI and repeat count.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable basis and fixed detail table define cached texture/UV scale; document strength and age are reevaluated because they change normal scale.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One texture URI and repeat scalar remain with the reachable closure; raster temporaries expire after generation and no renderer texture handle or task is acquired.
 */
export function createHumanBodySkinDetail(
  basis: IAutoMovieHumanBodyBasis,
): (input: {
  document: IAutoMovieHumanBodyBasisDocument;
  materialMap: Map<string, IAutoMovieMaterial>;
}) => void {
  let relief: { texture: string; turns: number } | null = null;
  return (input: {
    document: IAutoMovieHumanBodyBasisDocument;
    materialMap: Map<string, IAutoMovieMaterial>;
  }): void => {
    const { document, materialMap }: typeof input = input;
    const detail: IAutoMovieHumanBodyBasisDocument["skinDetail"] =
      document.skinDetail;
    if (detail === undefined) return;
    const skin: string = HUMAN_BODY_SKIN_SITES.material;
    if (
      !materialMap.has(skin) ||
      !(detail.strength >= 0 && detail.strength <= 1) ||
      basis.surfaces.some(
        (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean =>
          surface.regions.some(
            (
              region: IAutoMovieHumanBodyBasis["surfaces"][number]["regions"][number],
            ): boolean => region.material === skin && region.uvs === null,
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
    const material: IAutoMovieMaterial = materialMap.get(skin)!;
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
    const deepening: number = humanBodySimpleShapeMath.curve(
      HUMAN_BODY_SKIN_DETAIL.age,
      document.shape.macroAge ?? 0,
    );
    const anatomical: IAutoMovieHumanBodyBasis["surfaces"][number]["relief"] =
      basis.surfaces.find(
        (surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean =>
          surface.relief?.material === skin,
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
