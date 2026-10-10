import { humanFaceBasisWeights } from "@automovie/human/face/basis/humanFaceBasisWeights";
import { prepareHumanFaceReference } from "@automovie/human/face/basis/prepareHumanFaceReference";
import { resolveHumanFaceAppearanceDocument } from "@automovie/human/face/basis/resolveHumanFaceAppearanceDocument";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceBrowMaterialReference } from "./structures/IHumanSourceBrowMaterialReference.ts";

/**
 * Prepare the normal empty-shape/expression consumer bootstrap reference.
 * The ordinary appearance resolver supplies its unchanged population defaults;
 * the ordinary reference owner performs identity, persistent relief and replay.
 * Source generation and attachment preparation consume this same result rather
 * than defining a smaller or altered bootstrap to fit a native support disk.
 * Arrays remain canonical head-frame metres and introduce no rendered model.
 */
export function prepareHumanSourceBootstrapMaterialReference(
  basis: IAutoMovieHumanFaceBasis,
): IHumanSourceBrowMaterialReference {
  const document = resolveHumanFaceAppearanceDocument(basis, {
    id: basis.id, name: basis.id, basis: basis.id, shape: {}, expression: {},
  });
  const prepared = prepareHumanFaceReference({
    basis, state: humanFaceBasisWeights(basis, document), geometry: document,
  });
  const positions = prepared.complete();
  if (positions === undefined)
    throw new Error("Source material support needs the normal bootstrap's complete reference.");
  return { document, positions };
}
