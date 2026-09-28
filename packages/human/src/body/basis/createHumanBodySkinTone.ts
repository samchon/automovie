import type { IAutoMovieMaterial } from "@automovie/interface";

import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import { HUMAN_BODY_SKIN_TONE } from "../constants/HUMAN_BODY_SKIN_TONE";
import { humanBodySimpleShapeMath } from "../simple/humanBodySimpleShapeMath";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinToneTexture } from "./createHumanBodySkinToneTexture";
import { humanBodySkinMetresPerUv } from "./humanBodySkinMetresPerUv";

/**
 * Compile the skin's spatial chromophore variation for one body revision.
 *
 * The document's tone strength and age select a deterministic 1/20-strength
 * bin. Each bin's generated texture is cached only for this basis; the
 * document's copied skin material receives the tiled sRGB map and its
 * compensating base colour. The median source UV-to-surface area ratio sets
 * one repeat count in metres; local UV stretch still varies across the body.
 * This stage reads the body basis
 * and document and mutates only the caller's fresh material copy. It changes
 * neither the shared skin positions nor the per-site colour multipliers.
 */
export function createHumanBodySkinTone(basis: IAutoMovieHumanBodyBasis) {
  const tones = new Map<
    number,
    ReturnType<typeof createHumanBodySkinToneTexture>
  >();
  let toneTurns: number | null = null;
  return (
    document: IAutoMovieHumanBodyBasisDocument,
    materialMap: Map<string, IAutoMovieMaterial>,
  ): void => {
    const toneOf = document.skinTone;
    if (toneOf === undefined) return;
    const skin = HUMAN_BODY_SKIN_SITES.material;
    if (
      !materialMap.has(skin) ||
      !(toneOf.strength >= 0 && toneOf.strength <= 1) ||
      basis.surfaces.some((surface) =>
        surface.regions.some(
          (region) => region.material === skin && region.uvs === null,
        ),
      )
    )
      throw new Error(
        "Body skin tone needs a skin material on textured regions and a strength in [0,1].",
      );
    const material = materialMap.get(skin)!;
    const toneStrength =
      Math.round(
        20 *
          toneOf.strength *
          humanBodySimpleShapeMath.curve(
            HUMAN_BODY_SKIN_TONE.age,
            document.shape.macroAge ?? 0,
          ),
      ) / 20;
    if (toneStrength <= 0) return;
    let tone = tones.get(toneStrength);
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
    const [kr, kg, kb] = tone.compensation;
    material.baseColor = {
      ...material.baseColor,
      r: Math.min(1, material.baseColor.r * kr),
      g: Math.min(1, material.baseColor.g * kg),
      b: Math.min(1, material.baseColor.b * kb),
      hex: null,
    };
  };
}
