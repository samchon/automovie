import { assertHumanFaceEditableDetail } from "../document/assertHumanFaceEditableDetail";
import { mergeHumanFaceSettings } from "../document/mergeHumanFaceSettings";
import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertDetailValue } from "./assertDetailValue";
import { humanFaceDetailDefinition } from "./humanFaceDetailDefinition";
import { writeHumanFaceDetail } from "./writeHumanFaceDetail";

/**
 * Edit one named additional hair layer with the existing hair scalar vocabulary.
 * The selected authored population becomes a whole-array override, preserving
 * every other layer and the separate legacy hair owner. Clearing one scalar is
 * deliberately absent: inheritance resets the entire additional-layer region.
 * The copied layer's nonempty card guides must exactly match its source basis;
 * this method changes only a scalar finish/shape field, not a hair path.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Edits a named layer's numeric profile without requiring its guide array to be re-entered.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Uses the same hair channel bounds and units while retaining complete-array replacement semantics.
 */
export function setHumanFaceHairLayerDetail(
  document: IAutoMovieHumanFaceDocument,
  layerId: string,
  id: string,
  value: number,
): IAutoMovieHumanFaceDocument {
  const definition = humanFaceDetailDefinition(id);
  if (definition.region !== "hair")
    throw new Error("A hair layer accepts only hair detail channels.");
  assertDetailValue(definition, value);
  const layers = mergeHumanFaceSettings(
    document.basis.recipe.hairLayers,
    document.detail?.hairLayers,
  );
  const index = layers?.findIndex((layer) => layer.id === layerId) ?? -1;
  if (index < 0) throw new Error("The selected hair layer does not exist.");
  const next = structuredClone(document);
  (next.detail ??= {}).hairLayers = layers;
  const edited = writeHumanFaceDetail(
    next,
    ["detail", "hairLayers", String(index), "profile", ...definition.path],
    value,
  );
  assertHumanFaceEditableDetail(edited);
  return edited;
}
