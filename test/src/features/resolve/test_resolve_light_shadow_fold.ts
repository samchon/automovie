import { applyLightOverride } from "@automovie/engine";
import { IAutoMovieLight, IAutoMovieLightShadow } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** Order field names by their UTF-16 code units, independent of object insertion order. */
function fieldOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const SHADOW: IAutoMovieLightShadow = {
  mapSize: 2048,
  bias: -0.0005,
  normalBias: 0.03,
  near: 0.5,
  far: 120,
};

const KEY: IAutoMovieLight = {
  id: "key",
  type: "spot",
  transform: {
    translation: { x: 0, y: 4, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  color: { r: 1, g: 0.96, b: 0.9, a: null, hex: null },
  intensity: 8,
  range: 0,
  coneAngle: 35,
  castShadow: true,
  shadow: SHADOW,
};

/**
 * Folding animated light values preserves staged shadow policy.
 *
 * Reconstructing a light must retain unanimated castShadow and shadow fields rather than silently losing them when intensity changes. This test observes the returned records and references, not rendered occlusion.
 *
 * Scenarios:
 *
 * 1. A shadow-casting key whose intensity a clip drives keeps `castShadow` and the
 *    exact staged shadow settings, by identity rather than by copy.
 * 2. A light staged without either keeps both keys absent while its range
 *    changes from 6 to 9. This checks optional-key shape, not serialized bytes
 *    or a content digest.
 * 3. Calling the direct helper with an empty override rebuilds the same staged
 *    field values. Untouched whole-light identity is a shot-resolver contract
 *    tested by test_resolve_shot_lighting, not this direct helper.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls applyLightOverride and checks intensity/cone values, staged shadow reference preservation, optional-key absence and all staged field values under an empty override.
 * @evidence contracts/testing.md#independent-expectations A dimmer writes only intensity, so unrelated staged shadow/cone policy remains; absent optional keys stay absent and an empty override preserves authored numerical fields. This is output semantics, not a serialization digest experiment.
 * @evidence contracts/testing.md#distinguishing-cases Shadow-enabled spot and legacy point lights distinguish preservation from inventing defaults, while an empty override checks unchanged values; untouched whole-light identity and other light kinds have separate shot/area cases.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_light_shadow_fold entry executes portable synchronous reconstruction through the real helper, without rendering a shadow map or asserting GPU occlusion.
 */
export function test_resolve_light_shadow_fold(): void {
  const dimmed: IAutoMovieLight = applyLightOverride(KEY, { intensity: 2 });
  TestValidator.equals(
    "an animated key keeps casting exactly the shadow it was staged with",
    namedFacts([
      ["dimmed", (): boolean => nclose(dimmed.intensity, 2, 0)],
      ["casts", (): boolean => dimmed.castShadow === true],
      ["sameSettings", (): boolean => dimmed.shadow === SHADOW],
      ["stillSpot", (): boolean => dimmed.type === "spot"],
      [
        "coneKept",
        (): boolean =>
          dimmed.type === "spot" && nclose(dimmed.coneAngle, 35, 0),
      ],
    ]),
    {
      dimmed: true,
      casts: true,
      sameSettings: true,
      stillSpot: true,
      coneKept: true,
    },
  );

  const legacy: IAutoMovieLight = {
    id: "lamp",
    type: "point",
    transform: KEY.transform,
    color: KEY.color,
    intensity: 1,
    range: 6,
  };
  const folded: IAutoMovieLight = applyLightOverride(legacy, { range: 9 });
  TestValidator.equals(
    "a legacy light gains neither optional key",
    Object.keys(folded).sort(fieldOrder),
    ["color", "id", "intensity", "range", "transform", "type"],
  );
  TestValidator.predicate(
    "legacy range override applies",
    folded.type === "point" && nclose(folded.range, 9, 0),
  );

  const empty: IAutoMovieLight = applyLightOverride(KEY, {});
  TestValidator.equals(
    "empty override retains staged discrete fields and keys",
    [
      empty.id,
      empty.type,
      empty.castShadow,
      empty.color.a,
      empty.color.hex,
      Object.keys(empty).sort(fieldOrder),
      Object.keys(empty.transform).sort(fieldOrder),
      Object.keys(empty.color).sort(fieldOrder),
      Object.keys(empty.shadow ?? {}).sort(fieldOrder),
      empty.shadow?.mapSize,
    ],
    [
      KEY.id,
      KEY.type,
      KEY.castShadow,
      KEY.color.a,
      KEY.color.hex,
      Object.keys(KEY).sort(fieldOrder),
      Object.keys(KEY.transform).sort(fieldOrder),
      Object.keys(KEY.color).sort(fieldOrder),
      Object.keys(SHADOW).sort(fieldOrder),
      SHADOW.mapSize,
    ],
  );
  TestValidator.equals(
    "empty override retains transform component keys",
    [
      Object.keys(empty.transform.translation).sort(fieldOrder),
      Object.keys(empty.transform.rotation).sort(fieldOrder),
      Object.keys(empty.transform.scale).sort(fieldOrder),
    ],
    [
      Object.keys(KEY.transform.translation).sort(fieldOrder),
      Object.keys(KEY.transform.rotation).sort(fieldOrder),
      Object.keys(KEY.transform.scale).sort(fieldOrder),
    ],
  );
  TestValidator.predicate(
    "empty override retains all staged numerical fields",
    empty.type === "spot" &&
      vclose(empty.transform.translation, KEY.transform.translation, 0) &&
      vclose(empty.transform.scale, KEY.transform.scale, 0) &&
      nclose(empty.transform.rotation.x, KEY.transform.rotation.x, 0) &&
      nclose(empty.transform.rotation.y, KEY.transform.rotation.y, 0) &&
      nclose(empty.transform.rotation.z, KEY.transform.rotation.z, 0) &&
      nclose(empty.transform.rotation.w, KEY.transform.rotation.w, 0) &&
      nclose(empty.color.r, KEY.color.r, 0) &&
      nclose(empty.color.g, KEY.color.g, 0) &&
      nclose(empty.color.b, KEY.color.b, 0) &&
      nclose(empty.intensity, 8, 0) &&
      nclose(empty.range, 0, 0) &&
      nclose(empty.coneAngle, 35, 0) &&
      empty.shadow !== undefined &&
      nclose(empty.shadow.bias!, SHADOW.bias!, 0) &&
      nclose(empty.shadow.normalBias!, SHADOW.normalBias!, 0) &&
      nclose(empty.shadow.near!, SHADOW.near!, 0) &&
      nclose(empty.shadow.far!, SHADOW.far!, 0),
  );
}
