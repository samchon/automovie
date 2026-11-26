import type { IAutoMovieLightPointer } from "@automovie/interface";

import { formatLightPointer } from "./formatLightPointer";
import { isLightProperty } from "./isLightProperty";

/**
 * Parse canonical /lights/<id>/<property> addresses, returning null for wrong
 * shape, unsupported property, empty id or invalid/noncanonical RFC-6901
 * escaping. Light ids are stable scene identifiers; actual target existence is
 * checked by the consumer.
 */
export function parseLightPointer(
  pointer: string,
): IAutoMovieLightPointer | null {
  const segments: string[] = pointer.split("/");
  if (segments.length !== 4) return null;
  if (segments[0] !== "" || segments[1] !== "lights") return null;
  const property: string = segments[3]!;
  if (!isLightProperty(property)) return null;
  const light: string = unescapePointerSegment(segments[2]!);
  if (light.length === 0) return null;
  if (formatLightPointer(light, property) !== pointer) return null;
  return { light, property };
}

/** RFC-6901: `~1` becomes `/` and `~0` becomes `~`, in that order. */
const unescapePointerSegment: (segment: string) => string = (
  segment: string,
): string => segment.replaceAll("~1", "/").replaceAll("~0", "~");
