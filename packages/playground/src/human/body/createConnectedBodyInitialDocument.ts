import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createPortraitMaterials } from "@automovie/human/face/anatomy/cranium/createPortraitMaterials";

/**
 * The body editor's starting document on a body revision: neutral shape, the
 * skin coloured by site from the neutral face's skin finish as the cheek (so
 * it meets the face at the neck), and micro-relief, uneven tone and
 * superficial veins at their measured strengths.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Gives the editor its starting document, which reset returns to: neutral shape, site-coloured skin and measured micro-relief, tone and veins.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Fixes the initial inputs the editor's controls display before the first edit.
 * @author Samchon
 */
export function createConnectedBodyInitialDocument(
  basis: string,
): IAutoMovieHumanBodyBasisDocument {
  const cheek = createPortraitMaterials().find(
    (material) => material.id === "skin",
  )!.baseColor;
  return {
    id: "connected-body",
    name: "CC0 connected body",
    basis,
    shape: {},
    skinColour: { cheek: { r: cheek.r, g: cheek.g, b: cheek.b } },
    skinDetail: { strength: 1 },
    skinTone: { strength: 1 },
    skinVeins: { strength: 1 },
  };
}
