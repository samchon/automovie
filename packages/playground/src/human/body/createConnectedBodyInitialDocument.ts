import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createPortraitMaterials } from "@automovie/human/face/anatomy/cranium/createPortraitMaterials";

/**
 * The body editor's starting document on a body revision: neutral shape, the
 * skin coloured by site from the neutral face's skin finish as the cheek (so
 * it meets the face at the neck), and micro-relief, uneven tone and
 * superficial veins at their measured strengths.
 *
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
    name: "Connected body",
    basis,
    shape: {},
    skinColour: { cheek: { r: cheek.r, g: cheek.g, b: cheek.b } },
    skinDetail: { strength: 1 },
    skinTone: { strength: 1 },
    skinVeins: { strength: 1 },
  };
}
