import { isRecord } from "@automovie/engine";
import type { IAutoMovieShot } from "@automovie/interface";

/**
 * Read the played duration in seconds from an already object-checked sequence entry. A numeric trim duration takes precedence; absence of a referenced shot returns null so the sequence owner cannot invent an adjacent span.
 */
export const entryDuration = (
  entry: Record<string, unknown>,
  shot: IAutoMovieShot | undefined,
): number | null => {
  if (shot === undefined) return null;
  if (isRecord(entry.trim) && typeof entry.trim.duration === "number")
    return entry.trim.duration;
  return shot.duration;
};
