import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Preserve the mesh-only dental-row API. Native preparation owns the arch,
 * optional surface separation and cervical identities, so spacing and drawing
 * cannot silently use different crown constructions.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Publishes the composed enamel group from the shared native row producer.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Retains the row's complete placed mesh and normals without duplicating arch or crown formulas.
 */
export function buildPortraitDentalRow(
  input: IPortraitDentalRow,
): IAutoMovieMesh {
  return preparePortraitDentalRow(input).mesh;
}
