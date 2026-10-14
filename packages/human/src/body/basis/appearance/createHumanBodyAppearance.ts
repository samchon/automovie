import type {
  IAutoMovieJointPose,
  IAutoMovieMaterial,
} from "@automovie/interface";

import { applyHumanSkinFinish } from "../../../common/skin/applyHumanSkinFinish";
import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodyAppearanceInput } from "./IHumanBodyAppearanceInput";
import type { IHumanBodyAppearanceResult } from "./IHumanBodyAppearanceResult";
import { createHumanBodySkinColour } from "./createHumanBodySkinColour";
import { createHumanBodySkinDetail } from "./createHumanBodySkinDetail";
import { createHumanBodySkinOverlays } from "./createHumanBodySkinOverlays";
import { createHumanBodySkinTone } from "./createHumanBodySkinTone";

/**
 * Resolve one document's material copies and per-surface colour multipliers. Skin maps are made only on first use and then reused for later documents on the same basis. The body builder owns rest and lean evaluation so veins and sag read identical shaped positions when both are requested. Source UVs determine physical tile scale in metres; maps carry their own linear or sRGB colour space. The copied material array is new per document; compiled site fields, UV repeat counts and generated textures are reused across documents. The caller must keep this compiled basis unchanged while using the closure.
 *
 * @evidence contracts/common.md#principled-implementation Fresh document material copies receive admitted overrides and authored site/scattering/detail/overlay/tone mappings, with matching builder-owned rest/lean suppliers and unchanged geometry.
 * @evidence contracts/common.md#clear-and-simple-design One appearance closure coordinates existing finish owners and lazily compiles neutral site weights while geometry evaluation remains body-builder responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same-basis caches require an unchanged admitted source, and authored skin appearance responses cannot certify personal physiology or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives per-document material ownership, color spaces, UV meter scale, shared rest/lean provenance and cache invalidation premise.
 * @evidence contracts/performance.md#efficient-algorithms Per-document material cloning/map/override work scales with M materials; site colors scale with V vertices and prominence/pose lookups, while first-use source weighting and texture synthesis dominate compilation.
 * @evidence contracts/performance.md#reuse-equivalent-work One fixed-basis closure reuses neutral site weights and detail/tone textures; cheek, pose and document overrides are reevaluated because they change current material output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains source-sized site fields and texture-owner caches until unreachable; fresh materials/color arrays escape per call and no renderer handles or worker tasks are acquired here.
 */
export function createHumanBodyAppearance(
  basis: IAutoMovieHumanBodyBasis,
): (input: IHumanBodyAppearanceInput) => IHumanBodyAppearanceResult {
  // Read the site weights from the basis only when the first cheek asks for them.
  let siteColour: ReturnType<typeof createHumanBodySkinColour> | null = null;
  const detail: ReturnType<typeof createHumanBodySkinDetail> =
    createHumanBodySkinDetail(basis);
  const tone: ReturnType<typeof createHumanBodySkinTone> =
    createHumanBodySkinTone(basis);
  return (input: IHumanBodyAppearanceInput): IHumanBodyAppearanceResult => {
    const { document, pose, restAll, leanOf }: IHumanBodyAppearanceInput =
      input;
    const materials: IAutoMovieMaterial[] = structuredClone(basis.materials);
    const materialMap: Map<string, IAutoMovieMaterial> = new Map(
      materials.map(
        (material: IAutoMovieMaterial): [string, IAutoMovieMaterial] => [
          material.id,
          material,
        ],
      ),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material: IAutoMovieMaterial | undefined = materialMap.get(id);
      const values: number[] = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value: number): boolean =>
            !Number.isFinite(value) || value < 0 || value > 1,
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
    const skin: string = HUMAN_BODY_SKIN_SITES.material;
    // skin is translucent: its material takes the scattering distance from
    // the source-owned skin finish
    applyHumanSkinFinish(materials);
    const cheek:
      | NonNullable<
          IHumanBodyAppearanceInput["document"]["skinColour"]
        >["cheek"]
      | undefined = document.skinColour?.cheek;
    if (
      cheek !== undefined &&
      (!materialMap.has(skin) ||
        document.materials?.[skin]?.color !== undefined ||
        [cheek.r, cheek.g, cheek.b].some(
          (value: number): boolean => value <= 0 || value > 1,
        ))
    )
      throw new Error(
        "Body skin colour needs a skin material without a colour override and a cheek albedo in (0,1].",
      );
    const coloured: IHumanBodyAppearanceResult["coloured"] =
      cheek === undefined
        ? null
        : (siteColour ??= createHumanBodySkinColour(basis))(
            [cheek.r, cheek.g, cheek.b],
            // the skin over a joint lightens as the coupled pose folds it
            (bone: string): number | null =>
              pose.find(
                (row: IAutoMovieJointPose): boolean => row.bone === bone,
              )?.flexion ?? null,
          );
    if (coloured !== null) {
      const [r, g, b]: [number, number, number] = coloured.base;
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
