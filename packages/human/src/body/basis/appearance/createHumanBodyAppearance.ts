/**
 * Compile the body's material and skin finish stage over one admitted basis.
 * Its lazy site-colour and texture caches belong to that basis revision; each
 * document receives fresh materials, while rest-shape and lean-shape values
 * are supplied by the builder that owns their evaluation order. The stage
 * applies material overrides, anatomical site colour, scattering, relief,
 * overlays and chromophore tone before geometry is split into material parts.
 * It neither moves skin vertices nor mutates the basis or document.
 */
import type { IAutoMovieJointPose } from "@automovie/interface";

import { HUMAN_BODY_SKIN_SCATTERING } from "../../constants/HUMAN_BODY_SKIN_SCATTERING";
import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanBodySkinColour } from "./createHumanBodySkinColour";
import { createHumanBodySkinDetail } from "./createHumanBodySkinDetail";
import { createHumanBodySkinOverlays } from "./createHumanBodySkinOverlays";
import { createHumanBodySkinTone } from "./createHumanBodySkinTone";
import { evaluateHumanBodyShape } from "../evaluateHumanBodyShape";

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
  const detail = createHumanBodySkinDetail(basis);
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
    detail({ document, materialMap });
    createHumanBodySkinOverlays({
      basis,
      document,
      materialMap,
      restAll,
      leanOf,
    });
    tone(document, materialMap);
    return { materials, coloured };
  };
}
