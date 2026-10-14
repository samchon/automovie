import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createPortraitMaterials } from "@automovie/human/face/anatomy/cranium/createPortraitMaterials";

/**
 * Start the standalone body editor with empty authored weights on the supplied revision and the portrait palette's cheek colour.
 *
 * Detail, tone and vein strength 1 are presentation defaults, not measured subject quantities. The palette currently constructs its full material list to obtain skin; this fixed-size allocation remains local to initialization. The Human builder admits the revision and document later.
 *
 * @evidence contracts/common.md#principled-implementation Empty channel weights express the basis neutral document, the canonical portrait skin colour supplies the cheek site, and strength 1 selects each existing presentation layer's default amount.
 * @evidence contracts/common.md#clear-and-simple-design One document factory gathers the existing palette and authored defaults; source admission and model construction remain with the Human builder and viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed id and name identify the actual standalone editor document, while palette colour and presentation strengths do not masquerade as measured anatomy or fixture-derived answers.
 * @evidence contracts/common.md#meaningful-documentation The comment explains neutral weights, revision admission ownership, cheek palette provenance, default strengths and the full palette allocation.
 * @evidence contracts/performance.md#efficient-algorithms Initialization creates and scans the palette's m material records to find skin and returns a constant-size document in O(m) time and temporary storage; m is the fixed portrait palette rather than body mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This document factory creates independently editable initial state rather than sharing mutable documents or coordinating requests; callers own the initialization frequency.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the cheek RGB numbers are retained in the returned document, so the remaining temporary palette records become unreachable after return and no renderer or worker handle is acquired.
 */
export function createConnectedBodyInitialDocument(
  basis: string,
): IAutoMovieHumanBodyBasisDocument {
  const cheek: ReturnType<typeof createPortraitMaterials>[number]["baseColor"] =
    createPortraitMaterials().find(
      (material: ReturnType<typeof createPortraitMaterials>[number]): boolean =>
        material.id === "skin",
    )!.baseColor;
  return {
    id: "connected-body",
    name: "Connected body",
    basis,
    shape: {},
    skinColour: { cheek: { r: cheek.r, g: cheek.g, b: cheek.b } },
    skinDetail: { strength: 1 },
    skinTone: { strength: 1 },
    skinVeins: { strength: 1 },
  };
}
