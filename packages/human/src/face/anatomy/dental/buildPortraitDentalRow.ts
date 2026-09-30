import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Preserve the mesh-only dental-row API. Native preparation owns the arch,
 * optional surface separation and cervical identities, so spacing and drawing
 * cannot silently use different crown constructions.
 */
export function buildPortraitDentalRow(
  input: IPortraitDentalRow,
): IAutoMovieMesh {
  return preparePortraitDentalRow(input).mesh;
}
