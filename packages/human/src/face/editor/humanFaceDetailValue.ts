import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { definitionOf } from "./definitionOf";
import { humanFaceRegionValue } from "./humanFaceRegionValue";

/**
 * Read one present scalar from the final applied anatomical profile.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Displays actual combined values rather than echoing a slider's requested number.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Resolves side-aware scalar display through the document interpreter.
 */
export function humanFaceDetailValue(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  side?: "right" | "left",
): number | undefined {
  const definition = definitionOf(id);
  let value: unknown = humanFaceRegionValue(document, definition.region, side);
  for (const key of definition.path) {
    if (value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value as number | undefined;
}
