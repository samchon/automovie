import { IAutoMovieLightPointer } from "./IAutoMovieLightPointer";
import { formatLightPointer } from "./formatLightPointer";
import { isLightProperty } from "./isLightProperty";

/**
 * Parse canonical /lights/<id>/<property> addresses, returning null for wrong shape, unsupported property, empty id or invalid/noncanonical RFC-6901 escaping. Light ids are stable scene identifiers; actual target existence is checked by the consumer.
 *
 * @evidence contracts/common.md#principled-implementation Require /lights/id/property shape, supported property, nonempty decoded id and exact RFC-6901 formatter round-trip; other inputs return null.
 * @evidence contracts/common.md#clear-and-simple-design Supported properties and escaping delegate to canonical owners, separating syntax from eventual light lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stable ids determine addresses and malformed/extra segments are refused rather than normalized into another target.
 * @evidence contracts/common.md#meaningful-documentation Docs identify tilde/slash escaping, canonical spelling and null refusal; target existence remains with shot resolution.
 * @evidence contracts/performance.md#efficient-algorithms S pointer characters require O(S) splitting, decoding and re-encoding with proportional temporary text.
 * @evidence contracts/performance.md#reuse-equivalent-work All pointer producers/parser checks share formatLightPointer, without caching existence across mutable scenes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only decoded strings/property escape; segments and re-encoded text release with the call, with no scene handle or task.
 */
export const parseLightPointer: (pointer: unknown) => IAutoMovieLightPointer | null = (
  pointer: unknown,
): IAutoMovieLightPointer | null => {
  if (typeof pointer !== "string") return null;
  const segments: string[] = pointer.split("/");
  if (segments.length !== 4) return null;
  if (segments[0] !== "" || segments[1] !== "lights") return null;
  const property: string = segments[3]!;
  if (!isLightProperty(property)) return null;
  const light: string = unescapePointerSegment(segments[2]!);
  if (light.length === 0) return null;
  if (formatLightPointer(light, property) !== pointer) return null;
  return { light, property };
};

/** RFC-6901: `~1` becomes `/` and `~0` becomes `~`, in that order. */
const unescapePointerSegment: (segment: string) => string = (segment: string): string =>
  segment.replaceAll("~1", "/").replaceAll("~0", "~");
