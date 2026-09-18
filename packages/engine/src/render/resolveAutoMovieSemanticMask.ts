import { IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { IAutoMovieSemanticMaskResolution } from "./IAutoMovieSemanticMaskResolution";

/**
 * Read one rendered colour back to the thing it named, plus everything that
 * contains it.
 *
 * This is the whole point of the sidecar: a segmentation consumer holds a
 * pixel, not a graph. `#0A1B2C` becomes a door leaf, which becomes the door
 * opening, the wall boundary, the room, the storey and the building unit, and
 * every one of those is a stable id the design can be edited by.
 *
 * An unknown or malformed colour returns `null` rather than a guess.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Resolves one pixel colour to its stable drawable identity and complete ownership chain.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Interprets the structural pass through its paired sidecar and refuses unknown palette values.
 */
export const resolveAutoMovieSemanticMask = (
  mask: IAutoMovieSemanticMask,
  color: string,
): IAutoMovieSemanticMaskResolution | null => {
  const normalized = color.toUpperCase();
  const byColor = new Map(mask.entries.map((entry) => [entry.color, entry]));
  const entry = byColor.get(normalized);
  if (entry === undefined) return null;
  const byId = new Map(mask.entries.map((item) => [item.id, item]));
  const ancestors: IAutoMovieSemanticMaskEntry[] = [];
  const seen = new Set<string>([entry.id]);
  let owner = entry.owner;
  while (owner !== null && !seen.has(owner)) {
    seen.add(owner);
    const next = byId.get(owner);
    if (next === undefined) break;
    ancestors.push(next);
    owner = next.owner;
  }
  return { entry, ancestors };
};
