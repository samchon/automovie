import { assertHumanFaceEditableDetail } from "../document/assertHumanFaceEditableDetail";
import { mergeHumanFaceSettings } from "../document/mergeHumanFaceSettings";
import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertDetailValue } from "./assertDetailValue";
import { humanFaceDetailDefinition } from "./humanFaceDetailDefinition";
import { writeHumanFaceDetail } from "./writeHumanFaceDetail";
import type { IAutoMovieHumanFaceDetailChannel as IAutoMovieHumanFaceDetailChannelImported, IPortraitHairLayer as IPortraitHairLayerImported } from "../../index";


/**
 * Edit one named additional hair layer with the existing hair scalar vocabulary.
 * The selected authored population becomes a whole-array override, preserving
 * every other layer and the separate legacy hair owner. Clearing one scalar is
 * deliberately absent: inheritance resets the entire additional-layer region.
 * The copied layer's nonempty card guides must exactly match its source basis;
 * this method changes only a scalar finish/shape field, not a hair path.
 *
 * @evidence contracts/common.md#principled-implementation Existing hair scalar metadata edits one selected layer after basis/detail whole-array composition; the final immutable-detail rule compares nonempty card guides with the selected source layer. Other layers and the separate legacy hairstyle keep their values.
 * @evidence contracts/common.md#clear-and-simple-design The transaction owns named-layer selection, while shared settings merge, scalar admission and alias-safe path writing retain their established roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-hair channels, invalid values, absent layer or changed nonempty source guides refuse. Scalar clearing is deliberately unsupported here and requires region inheritance; source cards are not replaced by newly sculpted paths.
 * @evidence contracts/common.md#meaningful-documentation Prose states whole-array override, preserved other populations, source-equal cards, scalar-only edit and absent clearing; returned settings are owned and geometry is not yet admitted.
 * @evidence contracts/performance.md#efficient-algorithms Layer composition can clone inherited subtrees, layer selection scans L entries, document cloning copies the complete source and final guide comparison scans actual edited/source populations; cost exceeds one scalar write.
 * @evidence contracts/performance.md#reuse-equivalent-work This path uses existing hair metadata, merge and write rules; source-equal guide checks reuse authority by value rather than bypassing it by object identity after edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned document/layer arrays transfer; merged/intermediate copies and path tables are local, with no model cache, external handle or task retained.
 */
export function setHumanFaceHairLayerDetail(
  document: IAutoMovieHumanFaceDocument,
  layerId: string,
  id: string,
  value: number,
): IAutoMovieHumanFaceDocument {
  const definition: IAutoMovieHumanFaceDetailChannelImported = humanFaceDetailDefinition(id);
  if (definition.region !== "hair")
    throw new Error("A hair layer accepts only hair detail channels.");
  assertDetailValue(definition, value);
  const layers: readonly IPortraitHairLayerImported[] | undefined = mergeHumanFaceSettings(
    document.basis.recipe.hairLayers,
    document.detail?.hairLayers,
  );
  const index: number = layers?.findIndex((layer: IPortraitHairLayerImported): boolean  => layer.id === layerId) ?? -1;
  if (index < 0) throw new Error("The selected hair layer does not exist.");
  const next: IAutoMovieHumanFaceDocument = structuredClone(document);
  (next.detail ??= {}).hairLayers = layers;
  const edited: IAutoMovieHumanFaceDocument = writeHumanFaceDetail(
    next,
    ["detail", "hairLayers", String(index), "profile", ...definition.path],
    value,
  );
  assertHumanFaceEditableDetail(edited);
  return edited;
}
