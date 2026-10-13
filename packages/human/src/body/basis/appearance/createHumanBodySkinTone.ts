import type { IAutoMovieMaterial } from "@automovie/interface";

import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import { HUMAN_BODY_SKIN_TONE } from "../../constants/HUMAN_BODY_SKIN_TONE";
import { humanBodySimpleShapeMath } from "../../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinToneTexture } from "./createHumanBodySkinToneTexture";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";

/**
 * Compile the skin's spatial chromophore variation for one body revision.
 *
 * The document's tone strength and age select a deterministic 1/20-strength bin. Each bin's generated texture is cached only for this basis; the document's copied skin material receives the tiled sRGB map and its compensating base colour. The area-weighted median source UV-to-surface area ratio sets one repeat count in metres; local UV stretch still varies across the body. This stage reads the body basis and document and mutates only the caller's fresh material copy. It changes neither the shared skin positions nor the per-site colour multipliers.
 *
 * @evidence contracts/common.md#principled-implementation Declared strength and age curve select a rounded texture strength; neutral surface-to-UV median supplies repeat scale, while reciprocal pre-encoding mean compensation adjusts the material. Texture quantization and material clipping prevent a final mean-invariance guarantee.
 * @evidence contracts/common.md#clear-and-simple-design A basis-owned closure separates texture preparation from per-document material binding and leaves positions untouched.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested tone requires its skin material, textured skin regions and admitted strength; median scaling still leaves local UV distortion and does not assert measured pigmentation.
 * @evidence contracts/common.md#meaningful-documentation The comment explains binning, cache ownership, copied-material mutation and the unresolved local scaling variation.
 * @evidence contracts/performance.md#efficient-algorithms Each request scans regions for admission; texture construction runs only for a missing strength bin and UV median sorting only for the first positive tone.
 * @evidence contracts/performance.md#reuse-equivalent-work A strength-keyed map and one UV repeat value reuse basis-equivalent texture work; this assumes the captured basis and global table remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Generated PNG strings and the captured basis remain reachable with the closure; table-derived admitted strength bins bound the map, and dropping the closure releases its references without external handles.
 */
export function createHumanBodySkinTone(basis: IAutoMovieHumanBodyBasis): (document: IAutoMovieHumanBodyBasisDocument, materialMap: Map<string, IAutoMovieMaterial>) => void {
  const tones: Map<number, ReturnType<typeof createHumanBodySkinToneTexture>> = new Map<
    number,
    ReturnType<typeof createHumanBodySkinToneTexture>
  >();
  let toneTurns: number | null = null;
  return (
    document: IAutoMovieHumanBodyBasisDocument,
    materialMap: Map<string, IAutoMovieMaterial>,
  ): void => {
    const toneOf: IAutoMovieHumanBodyBasisDocument["skinTone"] = document.skinTone;
    if (toneOf === undefined) return;
    const skin: string = HUMAN_BODY_SKIN_SITES.material;
    if (
      !materialMap.has(skin) ||
      !(toneOf.strength >= 0 && toneOf.strength <= 1) ||
      basis.surfaces.some((surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean =>
        surface.regions.some(
          (region: IAutoMovieHumanBodyBasis["surfaces"][number]["regions"][number]): boolean => region.material === skin && region.uvs === null,
        ),
      )
    )
      throw new Error(
        "Body skin tone needs a skin material on textured regions and a strength in [0,1].",
      );
    const material: IAutoMovieMaterial = materialMap.get(skin)!;
    const toneStrength: number =
      Math.round(
        20 *
          toneOf.strength *
          humanBodySimpleShapeMath.curve(
            HUMAN_BODY_SKIN_TONE.age,
            document.shape.macroAge ?? 0,
          ),
      ) / 20;
    if (toneStrength <= 0) return;
    let tone: ReturnType<typeof createHumanBodySkinToneTexture> | undefined = tones.get(toneStrength);
    if (tone === undefined) {
      tone = createHumanBodySkinToneTexture(HUMAN_BODY_SKIN_TONE, toneStrength);
      tones.set(toneStrength, tone);
    }
    toneTurns ??=
      humanBodySkinMetresPerUv(basis, skin) /
      (HUMAN_BODY_SKIN_TONE.tileMillimetres / 1000);
    material.baseColorTexture = {
      asset: tone.texture,
      texCoord: 0,
      coordinateSource: "source-uv",
      colorSpace: "srgb",
      transform: {
        offset: { x: 0, y: 0 },
        scale: { x: toneTurns, y: toneTurns },
        rotationDeg: 0,
      },
      sampler: {
        wrapS: "repeat",
        wrapT: "repeat",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    };
    const [kr, kg, kb]: [number, number, number] = tone.compensation;
    material.baseColor = {
      ...material.baseColor,
      r: Math.min(1, material.baseColor.r * kr),
      g: Math.min(1, material.baseColor.g * kg),
      b: Math.min(1, material.baseColor.b * kb),
      hex: null,
    };
  };
}
