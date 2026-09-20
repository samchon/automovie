import { humanFaceDetailChannels } from "../channels/humanFaceDetailChannels";
import { mergeHumanFaceSettings } from "../document/mergeHumanFaceSettings";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";

/**
 * Edit one named additional hair layer with the existing hair scalar vocabulary.
 * The selected authored population becomes a whole-array override, preserving
 * every other layer and the separate legacy hair owner. Clearing one scalar is
 * deliberately absent: inheritance resets the entire additional-layer region.
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
  const definition = definitionOf(id);
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
  return writeDetail(
    next,
    ["detail", "hairLayers", String(index), "profile", ...definition.path],
    value,
  );
}

function assertDetailValue(
  definition: IAutoMovieHumanFaceDetailChannel,
  value: number | undefined,
): void {
  if (
    value !== undefined &&
    (!Number.isFinite(value) ||
      value < definition.minimum ||
      value > definition.maximum ||
      (definition.unit === "count" && !Number.isInteger(value)))
  )
    throw new Error(`Invalid numerical detail: ${definition.id}.`);
}

function writeDetail(
  next: IAutoMovieHumanFaceDocument,
  path: readonly string[],
  value: number | undefined,
): IAutoMovieHumanFaceDocument {
  let object = next as unknown as Record<string, unknown>;
  const ancestors: { object: Record<string, unknown>; key: string }[] = [];
  for (const key of path.slice(0, -1)) {
    if (object[key] === undefined) {
      if (value === undefined) return next;
      object[key] = {};
    } else {
      // structuredClone preserves aliases. Detach only the containers on this
      // path so a selected side/layer cannot also edit its basis or sibling.
      const child = object[key] as Record<string, unknown> | unknown[];
      object[key] = Array.isArray(child) ? [...child] : { ...child };
    }
    ancestors.push({ object, key });
    object = object[key] as Record<string, unknown>;
  }
  const key = path[path.length - 1];
  if (value === undefined) {
    if (!Object.hasOwn(object, key)) return next;
    delete object[key];
    for (const parent of ancestors.reverse()) {
      if (Object.keys(object).length !== 0) break;
      delete parent.object[parent.key];
      object = parent.object;
    }
  } else object[key] = value;
  return next;
}

function definitionOf(id: string): IAutoMovieHumanFaceDetailChannel {
  const definition = humanFaceDetailChannels.find(
    (channel) => channel.id === id,
  );
  if (definition === undefined)
    throw new Error(`Unknown anatomical detail: ${id}.`);
  return definition;
}
