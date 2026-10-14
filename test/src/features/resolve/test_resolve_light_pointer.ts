import { LIGHT_CHANNEL_PROPERTIES } from "../../../../packages/engine/src/resolve/constants/LIGHT_CHANNEL_PROPERTIES";
import { formatLightPointer } from "../../../../packages/engine/src/resolve/formatLightPointer";
import { isLightProperty } from "../../../../packages/engine/src/resolve/isLightProperty";
import { parseLightPointer } from "../../../../packages/engine/src/resolve/parseLightPointer";
import { TestValidator } from "@nestia/e2e";
import { type IAutoMovieLightPointer } from "../../../../packages/engine/src/resolve/IAutoMovieLightPointer";

/** `parse` reduced to a comparable shape: `"<light>|<property>"` or `null`. */
const parsed: (pointer: unknown) => string | null = (pointer: unknown): string | null => {
  const target: IAutoMovieLightPointer | null = parseLightPointer(pointer);
  return target === null ? null : `${target.light}|${target.property}`;
};

/**
 * The light pointer grammar (#1348): `/lights/<light id>/<property>`, the one
 * address form that can reach a light, since a light is not a scene node.
 *
 * Two properties carry the axis's safety. The light is named by its stable
 * **id**, never by its index in `scene.lights` — the benchmark agent wrote
 * `/lights/0/intensity` and an index read against an array whose order is
 * load-bearing elsewhere (the viewer's mask palette is keyed by top-level child
 * index) would silently re-target whenever staging inserts a light. And the
 * accepted property set is read out of `LIGHT_CHANNEL_PROPERTIES`, the same
 * table the applier writes through, so the grammar cannot admit a property
 * nothing applies.
 *
 * Expected values come from RFC-6901, which the channel type cites: `~1`
 * decodes to `/` and `~0` to `~`, in that order. Supported
 * `/lights/id/property` addresses also round-trip through the product formatter;
 * other address forms return null. General JSON Pointer target evaluation is
 * outside this test.
 *
 * Scenarios:
 *
 * 1. Every table property parses on a plain id, and each round-trips back to the
 *    pointer it came from. The placement pair (`position`, `rotation`) is
 *    addressed through the very same grammar as the four value axes, because a
 *    light's placement is not a second kind of thing to animate: automovie
 *    stages lights outside `nodes`, so a pointer is the ONLY way to reach one,
 *    and where it stands is as much the light's property as how bright it is.
 * 2. An id carrying reserved characters survives: `/lights/a~1b~0c/intensity`
 *    decodes to the id `a/b~c`, and formatting that id reproduces the pointer.
 * 3. Every way a string fails to be a light pointer yields `null` rather than a
 *    partial parse: a non-string, too few and too many segments, a relative
 *    pointer, a four-segment string whose leading segment is non-empty, a
 *    different collection (`/cameras/0/fovY`, the other example the channel
 *    type advertises), an unknown property, an empty id, and an invalid escape
 *    (`~2`), which the canonicality rule catches for free.
 * 4. `isLightProperty` answers from the table's OWN keys: `constructor` and
 *    `toString` are properties of every object and neither is a light
 *    property.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual light-pointer formatter/parser and property table, observing exact property names/order, literal addresses, escaped-id round trips, invalid-address refusal and rejection of inherited property names.
 * @evidence contracts/testing.md#independent-expectations RFC6901 sections3/4 encode tilde as ~0 and slash as ~1, decoding ~1 before ~0; the product's literal /lights/id/property grammar and authored six-property list determine other expectations. This does not check each property's light-kind predicate.
 * @evidence contracts/testing.md#distinguishing-cases Plain/slash/tilde ids and valid property neighbors contrast with empty ids, wrong roots/properties, extra segments and invalid escapes; scene target existence and actual light application belong to shot-lighting tests.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_light_pointer entry runs portable synchronous address/property-name semantics through direct source imports; no light is installed in a browser or native renderer.
 */
export function test_resolve_light_pointer(): void {
  // 1. every property in the table, and the round trip.
  const PROPERTIES: readonly ["intensity", "color", "range", "coneAngle", "position", "rotation"] = [
    "intensity",
    "color",
    "range",
    "coneAngle",
    "position",
    "rotation",
  ] as const;
  TestValidator.equals(
    "the table admits exactly these properties",
    Object.keys(LIGHT_CHANNEL_PROPERTIES),
    [...PROPERTIES],
  );
  TestValidator.equals(
    "each one parses, and formatting returns the pointer it came from",
    PROPERTIES.map((property: "rotation" | "intensity" | "color" | "range" | "coneAngle" | "position"): (string | null)[]  => [
      parsed(`/lights/candleGlow/${property}`),
      formatLightPointer("candleGlow", property),
    ]),
    PROPERTIES.map((property: "rotation" | "intensity" | "color" | "range" | "coneAngle" | "position"): string[]  => [
      `candleGlow|${property}`,
      `/lights/candleGlow/${property}`,
    ]),
  );

  // 2. RFC-6901 escaping, both directions.
  TestValidator.equals(
    "an escaped id decodes and re-encodes",
    [
      parsed("/lights/a~1b~0c/intensity"),
      formatLightPointer("a/b~c", "intensity"),
    ],
    ["a/b~c|intensity", "/lights/a~1b~0c/intensity"],
  );

  // 3. every non-pointer, refused as a whole.
  TestValidator.equals(
    "a string that is not a light pointer never half-parses",
    [
      parsed(42),
      parsed("/lights/candleGlow"),
      parsed("/lights/candleGlow/intensity/x"),
      parsed("lights/candleGlow/intensity"),
      parsed("x/lights/candleGlow/intensity"),
      parsed("/cameras/0/fovY"),
      parsed("/lights/candleGlow/temperature"),
      parsed("/lights//intensity"),
      parsed("/lights/a~2b/intensity"),
    ],
    [null, null, null, null, null, null, null, null, null],
  );

  // 4. the table's own keys, not every string an object answers to.
  TestValidator.equals(
    "an inherited object property is not a light property",
    [
      isLightProperty("intensity"),
      isLightProperty("constructor"),
      isLightProperty("toString"),
    ],
    [true, false, false],
  );
}
