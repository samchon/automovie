import {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Normalize a requested color to uppercase, find its entry and follow owner ids until root, missing link or cycle; unknown colors return null and malformed ownership yields only the reachable prefix rather than invented ancestry.
 * @evidence contracts/common.md#clear-and-simple-design Separate color and id maps support the pixel-to-owner join in one call, with ancestor traversal independent of renderer objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest color or fixture label is guessed; this helper does not verify mask digest, uniqueness or scalar schema, so callers requiring evidence admission use the verifier/derivation seam first.
 * @evidence contracts/common.md#meaningful-documentation Docs identify borrowed entry/ancestors, uppercase lookup, null unknown color and the incomplete-chain behavior on missing/cyclic owner links.
 * @evidence contracts/performance.md#efficient-algorithms E entries build two O(E) maps and at most H owner links are followed, with O(H) returned references; each pixel call currently rebuilds indices, a bulk-resolution reuse limitation rather than constant lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work The mask's own entry records are reused without copying; no persistent cache assumes mutable entries/ownership remain equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the ancestor array while entries remain mask-owned; local maps/seen set are released and no pixel buffer or native resource is retained.
 */
export const resolveAutoMovieSemanticMask: (mask: IAutoMovieSemanticMask, color: string) => IAutoMovieSemanticMaskResolution | null = (
  mask: IAutoMovieSemanticMask,
  color: string,
): IAutoMovieSemanticMaskResolution | null => {
  const normalized: string = color.toUpperCase();
  const byColor: Map<string, IAutoMovieSemanticMaskEntry> = new Map(mask.entries.map((entry: IAutoMovieSemanticMaskEntry) : [string, IAutoMovieSemanticMaskEntry] => [entry.color, entry]));
  const entry: IAutoMovieSemanticMaskEntry | undefined = byColor.get(normalized);
  if (entry === undefined) return null;
  const byId: Map<string, IAutoMovieSemanticMaskEntry> = new Map(mask.entries.map((item: IAutoMovieSemanticMaskEntry) : [string, IAutoMovieSemanticMaskEntry] => [item.id, item]));
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
};
