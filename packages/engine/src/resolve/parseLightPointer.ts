import { IAutoMovieLightPointer } from "./IAutoMovieLightPointer";
import { formatLightPointer } from "./formatLightPointer";
import { isLightProperty } from "./isLightProperty";

/**
 * Parse `/lights/<id>/<property>`, or `null` when the string is not one.
 *
 * The light is addressed by its stable **id**, never by its position in
 * `scene.lights`. An index would be read against an array whose order is itself
 * load-bearing elsewhere (the viewer's segmentation mask palette is keyed by
 * top-level child index), so an artifact addressing lights positionally would
 * silently re-target whenever staging inserts one.
 *
 * RFC-6901 escaping applies to the id segment (`~1` is `/`, `~0` is `~`, in
 * that order). A pointer that is not the canonical encoding of what it decodes
 * to is rejected, which also rejects an invalid escape such as `~2`.
 *
 * @evidence requirements/lighting/scope-and-identity.md#lighting-authored-input Parses one canonical authored-light property address.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-light-authority-branches Rejects a pointer that cannot select a declared light-property branch.
 */
export const parseLightPointer = (
  pointer: unknown,
): IAutoMovieLightPointer | null => {
  if (typeof pointer !== "string") return null;
  const segments = pointer.split("/");
  if (segments.length !== 4) return null;
  if (segments[0] !== "" || segments[1] !== "lights") return null;
  const property = segments[3]!;
  if (!isLightProperty(property)) return null;
  const light = unescapePointerSegment(segments[2]!);
  if (light.length === 0) return null;
  if (formatLightPointer(light, property) !== pointer) return null;
  return { light, property };
};
