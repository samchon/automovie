import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/** The canonical pointer addressing one light's property. */
export const formatLightPointer = (
  light: string,
  property: AutoMovieLightProperty,
): string => `/lights/${escapePointerSegment(light)}/${property}`;

/** RFC-6901: `~` becomes `~0` and `/` becomes `~1`, in that order. */
const escapePointerSegment = (segment: string): string =>
  segment.replaceAll("~", "~0").replaceAll("/", "~1");
