import { AutoMovieLightProperty } from "./AutoMovieLightProperty";

/** The canonical pointer addressing one light's property.
 *
 * @evidence contracts/common.md#principled-implementation Encode the light-id segment by RFC-6901 escaping tilde before slash and append the closed property name under /lights; parseLightPointer validates the same canonical spelling.
 * @evidence contracts/common.md#clear-and-simple-design One formatter owns escaping for authored channels and parser re-encoding rather than duplicating literal pointer construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty/unadmitted ids are not silently replaced; this encoding helper does not itself prove target existence or validate arbitrary runtime property casts.
 * @evidence contracts/common.md#meaningful-documentation Docs identify the canonical address and escaping order; ids containing slash/tilde remain a single segment.
 * @evidence contracts/performance.md#efficient-algorithms An id with S UTF-16 units needs O(S) replacement/output storage plus fixed path/property text.
 * @evidence contracts/performance.md#reuse-equivalent-work Pointer producers and the parser share this formatter; each supplied id is encoded directly without a retained string cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result string escapes and intermediate replacement text is temporary; no scene lookup, handle or task is retained.
 */
export const formatLightPointer: (light: string, property: AutoMovieLightProperty) => string = (
  light: string,
  property: AutoMovieLightProperty,
): string => `/lights/${escapePointerSegment(light)}/${property}`;

/** RFC-6901: `~` becomes `~0` and `/` becomes `~1`, in that order. */
const escapePointerSegment: (segment: string) => string = (segment: string): string =>
  segment.replaceAll("~", "~0").replaceAll("/", "~1");
