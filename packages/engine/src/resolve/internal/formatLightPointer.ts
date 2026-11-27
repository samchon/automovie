import type { AutoMovieLightProperty } from "@automovie/interface";

/** The canonical pointer addressing one light's property. */
export function formatLightPointer(
  light: string,
  property: AutoMovieLightProperty,
): string {
  return `/lights/${escapePointerSegment(light)}/${property}`;
}

/** RFC-6901: `~` becomes `~0` and `/` becomes `~1`, in that order. */
const escapePointerSegment: (segment: string) => string = (
  segment: string,
): string => segment.replaceAll("~", "~0").replaceAll("/", "~1");
