import {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
  type IAutoMovieSemanticMaskResolution,
} from "@automovie/interface";

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
 */
export function resolveAutoMovieSemanticMask(
  mask: IAutoMovieSemanticMask,
  color: string,
): IAutoMovieSemanticMaskResolution | null {
  const normalized: string = color.toUpperCase();
  const byColor: Map<string, IAutoMovieSemanticMaskEntry> = new Map(
    mask.entries.map(
      (
        entry: IAutoMovieSemanticMaskEntry,
      ): [string, IAutoMovieSemanticMaskEntry] => [entry.color, entry],
    ),
  );
  const entry: IAutoMovieSemanticMaskEntry | undefined =
    byColor.get(normalized);
  if (entry === undefined) return null;
  const byId: Map<string, IAutoMovieSemanticMaskEntry> = new Map(
    mask.entries.map(
      (
        item: IAutoMovieSemanticMaskEntry,
      ): [string, IAutoMovieSemanticMaskEntry] => [item.id, item],
    ),
  );
  const ancestors: IAutoMovieSemanticMaskEntry[] = [];
  const seen: Set<string> = new Set<string>([entry.id]);
  let owner: string | null = entry.owner;
  while (owner !== null && !seen.has(owner)) {
    seen.add(owner);
    const next: IAutoMovieSemanticMaskEntry | undefined = byId.get(owner);
    if (next === undefined) break;
    ancestors.push(next);
    owner = next.owner;
  }
  return { entry, ancestors };
}
