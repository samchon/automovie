import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { humanFaceDetailDefinition } from "./humanFaceDetailDefinition";
import { humanFaceRegionValue } from "./humanFaceRegionValue";

/**
 * Read one present scalar from the final applied anatomical profile.
 */
export function humanFaceDetailValue(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  side?: "right" | "left",
): number | undefined {
  const definition = humanFaceDetailDefinition(id);
  let value: unknown = humanFaceRegionValue(document, definition.region, side);
  for (const key of definition.path) {
    if (value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value as number | undefined;
}
