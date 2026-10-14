import type {
  IAutoMovieLight,
  IAutoMovieScript,
  IAutoMovieStageLight,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieStagedSet, stageScene } from "@automovie/engine";

import { assertFilmStageLightBoundaries } from "../internal/assertFilmStageLightBoundaries";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { nclose } from "../internal/nclose";
import {
  hasViolation,
  namedFacts,
  qclose,
  vclose,
} from "../internal/predicates";

const script: IAutoMovieScript = makeScriptWrite();

/** Stage the same duel through its existing runtime light boundary, admitting deliberately malformed test payloads without changing or validating them in the fixture. */
const stageLights: (lights: unknown[]) => IAutoMovieStagedSet = (
  lights: unknown[],
): IAutoMovieStagedSet =>
  stageScene(
    script,
    makeStagingWrite({ lights: lights as IAutoMovieStageLight[] }),
  );

/** The staged scene's lights, or `[]` when staging refused. */
const lightsOf: (staged: ReturnType<typeof stageScene>) => IAutoMovieLight[] = (
  staged: ReturnType<typeof stageScene>,
): IAutoMovieLight[] => (staged.success ? staged.scene.lights : []);

/** Staging violations as a validation envelope, for `hasViolation`. */
const failure: (
  staged: ReturnType<typeof stageScene>,
) => IAutoMovieValidation = (
  staged: ReturnType<typeof stageScene>,
): IAutoMovieValidation =>
  staged.success
    ? { success: true }
    : { success: false, violations: staged.violations };

const WARM: { r: number; g: number; b: number; a: null; hex: null } = {
  r: 1,
  g: 0.72,
  b: 0.36,
  a: null,
  hex: null,
};

/**
 * `stage` must be able to author every light the scene type can hold (#1341).
 *
 * It used to accept `{node, role, direction, intensity}` and lower every entry to a white directional light, so a candle, a sunset, a neon sign, and a window shaft were the same frame; an author who wanted a warm lamp had to hand-patch `scene.lights` between `stage` and `commitScene`, losing the referential integrity `stage` exists to provide. `role` was the other half: required, five-valued, and read nowhere.
 *
 * The scene type includes directional, point, spot and area lights; this entry pins the first three and the existing area entry owns the rectangular-panel rules. A parameter the chosen kind cannot use is refused rather than dropped, which is the same false-green rule the pointer-channel gate applies.
 *
 * Scenarios:
 *
 * 1. Compatibility: the pre-existing `{node, role, direction, intensity}` shape
 * still stages, and still lowers to exactly the white directional light at the origin it lowered to before, so no committed scene changes meaning.
 * 2. `role` is optional: dropping it preserves every lowered directional-light field, with zero tolerance for its numeric fields.
 * 3. A warm point light lowers to `type: "point"` at its `position`, in its color,
 * with its `range`; a spot with a supplied direction preserves `range`, `coneAngle` and position. The spot's rotation is not asserted here.
 * 4. Defaults: an omitted `type` is directional, an omitted `color` is neutral
 * white with `a: null` (the light-slot convention), an omitted `range` is `0` (infinite), an omitted `coneAngle` is `45`.
 * 5. Negative twins per kind, each one property away from a staging that works: a
 * directional light with a `position`, a point light with a `direction`, a point light with a `coneAngle`, a directional light with a `range`. Each is refused at its own field rather than ignored.
 * 6. Missing required-per-kind parameters: a directional or spot light with no
 * `direction`, and a point or spot light with no `position`.
 * 7. Boundaries: `intensity: 0` stages (a light that is off is a legitimate
 * light); a zero-length `direction` is refused; `coneAngle: 90` is accepted while zero, 90.0001 and NaN are refused; `range: 0` means infinite while a negative range is refused; a non-finite `position` is a range fault rather than a missing-parameter one; a color component outside `[0, 1]` is refused.
 * 8. A color that is not a JSON object
 * reports rather than dereferencing into a TypeError (the engine validator has no transport gate under it), a light-slot `a: null` is the documented value, and an alpha outside `[0, 1]` is refused at staging rather than passing `stage` and being refused a rung later by `commitScene`'s color artifact check, which is the wrong-stage failure this cycle closes elsewhere. A `null` direction or an array position is likewise reported at its own path instead of throwing.
 * 9. An unknown runtime discriminator is refused at `type`; it cannot fall through
 * to the directional default and enter a committed scene.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages legacy, point and spot writes and observes lowered fields/defaults and located refusals for unsupported or missing per-kind operands, then invokes the original numeric/color/discriminator boundary group.
 * @evidence contracts/testing.md#independent-expectations Authored values, neutral-white/infinite-range/45-degree defaults and the closed per-kind rules provide expectations; role deletion is a metamorphic lowering check and all observations remain CPU scene records rather than rendered light evidence.
 * @evidence contracts/testing.md#distinguishing-cases Preserves every legacy/roleless/point/spot/default case, all eight originally malformed per-kind writes and every delegated finite/color/discriminator boundary; area and shadow-specific neighbors belong to their existing entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_light_axis and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_light_axis(): void {
  // 1. Compatibility: the legacy four-field shape is unchanged.
  const legacy: IAutoMovieStagedSet = stageLights([
    {
      node: "sun",
      role: "sun",
      direction: { x: -1, y: -1, z: 0 },
      intensity: 1,
    },
  ]);
  const legacyLight: IAutoMovieLight = lightsOf(legacy)[0];
  TestValidator.equals("the legacy shape still stages", legacy.success, true);
  TestValidator.equals(
    "and still lowers to a directional light",
    legacyLight?.type,
    "directional",
  );
  TestValidator.predicate(
    "at the origin, in neutral white, as before",
    Object.values(
      namedFacts([
        ["legacyLight", (): boolean => legacyLight !== undefined],
        [
          "vcloseLegacyLightTransform",
          (): boolean =>
            legacyLight !== undefined &&
            vclose(legacyLight.transform.translation, { x: 0, y: 0, z: 0 }),
        ],
        [
          "legacyLightColorR",
          (): boolean =>
            legacyLight !== undefined && nclose(legacyLight.color.r, 1, 0),
        ],
        [
          "legacyLightColorG",
          (): boolean =>
            legacyLight !== undefined && nclose(legacyLight.color.g, 1, 0),
        ],
        [
          "legacyLightColorB",
          (): boolean =>
            legacyLight !== undefined && nclose(legacyLight.color.b, 1, 0),
        ],
        [
          "legacyLightColorA",
          (): boolean =>
            legacyLight !== undefined && legacyLight.color.a === null,
        ],
        [
          "legacyLightIntensity",
          (): boolean =>
            legacyLight !== undefined && nclose(legacyLight.intensity, 1, 0),
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );

  // 2. `role` is annotation: removing it changes nothing
  const roleless: IAutoMovieLight = lightsOf(
    stageLights([
      { node: "sun", direction: { x: -1, y: -1, z: 0 }, intensity: 1 },
    ]),
  )[0];
  TestValidator.predicate(
    "dropping role lowers to the identical light",
    roleless !== undefined &&
      legacyLight !== undefined &&
      roleless.id === legacyLight.id &&
      roleless.type === "directional" &&
      legacyLight.type === "directional" &&
      vclose(
        roleless.transform.translation,
        legacyLight.transform.translation,
        0,
      ) &&
      vclose(roleless.transform.scale, legacyLight.transform.scale, 0) &&
      nclose(
        roleless.transform.rotation.x,
        legacyLight.transform.rotation.x,
        0,
      ) &&
      nclose(
        roleless.transform.rotation.y,
        legacyLight.transform.rotation.y,
        0,
      ) &&
      nclose(
        roleless.transform.rotation.z,
        legacyLight.transform.rotation.z,
        0,
      ) &&
      nclose(
        roleless.transform.rotation.w,
        legacyLight.transform.rotation.w,
        0,
      ) &&
      nclose(roleless.color.r, legacyLight.color.r, 0) &&
      nclose(roleless.color.g, legacyLight.color.g, 0) &&
      nclose(roleless.color.b, legacyLight.color.b, 0) &&
      roleless.color.a === legacyLight.color.a &&
      roleless.color.hex === legacyLight.color.hex &&
      nclose(roleless.intensity, legacyLight.intensity, 0) &&
      roleless.castShadow === legacyLight.castShadow &&
      roleless.shadow === undefined &&
      legacyLight.shadow === undefined,
  );

  // 3. the axis the scene type always had
  const point: IAutoMovieLight = lightsOf(
    stageLights([
      {
        node: "flame",
        type: "point",
        position: { x: 0.2, y: 0.9, z: 0.35 },
        color: WARM,
        intensity: 1.4,
        range: 3,
      },
    ]),
  )[0];
  TestValidator.predicate(
    "a warm point light lowers with its place, color, and range",
    Object.values(
      namedFacts([
        ["point", (): boolean => point !== undefined],
        [
          "pointTypePoint",
          (): boolean => point !== undefined && point.type === "point",
        ],
        [
          "pointRange",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            nclose(point.range, 3, 0),
        ],
        [
          "pointIntensity",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            nclose(point.intensity, 1.4, 0),
        ],
        [
          "vclosePointTransform",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            vclose(point.transform.translation, { x: 0.2, y: 0.9, z: 0.35 }),
        ],
        [
          "pointColorR",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            nclose(point.color.r, WARM.r, 0),
        ],
        [
          "pointColorG",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            nclose(point.color.g, WARM.g, 0),
        ],
        [
          "pointColorB",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            nclose(point.color.b, WARM.b, 0),
        ],
        [
          "qclosePointTransform",
          (): boolean =>
            point !== undefined &&
            point.type === "point" &&
            qclose(point.transform.rotation, { x: 0, y: 0, z: 0, w: 1 }),
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );
  const spot: IAutoMovieLight = lightsOf(
    stageLights([
      {
        node: "practical",
        type: "spot",
        position: { x: 0, y: 2.4, z: 0 },
        direction: { x: 0, y: -1, z: 0 },
        intensity: 2,
        range: 6,
        coneAngle: 25,
      },
    ]),
  )[0];
  TestValidator.predicate(
    "a spot lowers with its cone, range and position",
    Object.values(
      namedFacts([
        ["spot", (): boolean => spot !== undefined],
        [
          "spotTypeSpot",
          (): boolean => spot !== undefined && spot.type === "spot",
        ],
        [
          "spotRange",
          (): boolean =>
            spot !== undefined &&
            spot.type === "spot" &&
            nclose(spot.range, 6, 0),
        ],
        [
          "spotConeAngle",
          (): boolean =>
            spot !== undefined &&
            spot.type === "spot" &&
            nclose(spot.coneAngle, 25, 0),
        ],
        [
          "vcloseSpotTransform",
          (): boolean =>
            spot !== undefined &&
            spot.type === "spot" &&
            vclose(spot.transform.translation, { x: 0, y: 2.4, z: 0 }),
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );

  // 4. Defaults.
  const defaults: IAutoMovieLight[] = lightsOf(
    stageLights([
      {
        node: "bulb",
        type: "point",
        position: { x: 1, y: 1, z: 1 },
        intensity: 1,
      },
      {
        node: "lamp",
        type: "spot",
        position: { x: 2, y: 2, z: 2 },
        direction: { x: 0, y: -1, z: 0 },
        intensity: 1,
      },
    ]),
  );
  TestValidator.predicate(
    "an omitted range is infinite and an omitted cone is 45 degrees",
    Object.values(
      namedFacts([
        ["defaults", (): boolean => defaults.length === 2],
        ["defaultsTypePoint", (): boolean => defaults[0]!.type === "point"],
        [
          "defaultsRange",
          (): boolean =>
            defaults[0]!.type === "point" && nclose(defaults[0]!.range, 0, 0),
        ],
        ["defaultsTypeSpot", (): boolean => defaults[1]!.type === "spot"],
        [
          "defaultsRange2",
          (): boolean =>
            defaults[1]!.type === "spot" && nclose(defaults[1]!.range, 0, 0),
        ],
        [
          "defaultsConeAngle",
          (): boolean =>
            defaults[1]!.type === "spot" &&
            nclose(defaults[1]!.coneAngle, 45, 0),
        ],
      ]),
    ).every((fact: boolean): boolean => fact),
  );

  // 5. A parameter unavailable to its chosen kind is refused.
  TestValidator.predicate(
    "a directional light takes no position",
    hasViolation(
      failure(
        stageLights([
          {
            node: "sun",
            direction: { x: -1, y: -1, z: 0 },
            position: { x: 0, y: 5, z: 0 },
            intensity: 1,
          },
        ]),
      ),
      "type",
      "$input.lights[0].position",
    ),
  );
  TestValidator.predicate(
    "a point light takes no direction",
    hasViolation(
      failure(
        stageLights([
          {
            node: "flame",
            type: "point",
            position: { x: 0, y: 1, z: 0 },
            direction: { x: 0, y: -1, z: 0 },
            intensity: 1,
          },
        ]),
      ),
      "type",
      "$input.lights[0].direction",
    ),
  );
  TestValidator.predicate(
    "a point light takes no cone",
    hasViolation(
      failure(
        stageLights([
          {
            node: "flame",
            type: "point",
            position: { x: 0, y: 1, z: 0 },
            intensity: 1,
            coneAngle: 30,
          },
        ]),
      ),
      "type",
      "$input.lights[0].coneAngle",
    ),
  );
  TestValidator.predicate(
    "a directional light takes no range",
    hasViolation(
      failure(
        stageLights([
          {
            node: "sun",
            direction: { x: -1, y: -1, z: 0 },
            intensity: 1,
            range: 10,
          },
        ]),
      ),
      "type",
      "$input.lights[0].range",
    ),
  );

  // 6. The parameters each kind requires.
  TestValidator.equals(
    "an aimed light without a direction is refused",
    namedFacts([
      [
        "directionalRefused",
        (): boolean =>
          hasViolation(
            failure(stageLights([{ node: "sun", intensity: 1 }])),
            "type",
            "$input.lights[0].direction",
          ),
      ],
      [
        "spotRefused",
        (): boolean =>
          hasViolation(
            failure(
              stageLights([
                {
                  node: "lamp",
                  type: "spot",
                  position: { x: 0, y: 2, z: 0 },
                  intensity: 1,
                },
              ]),
            ),
            "type",
            "$input.lights[0].direction",
          ),
      ],
    ]),
    { directionalRefused: true, spotRefused: true },
  );
  TestValidator.equals(
    "a positioned light without a position is refused",
    namedFacts([
      [
        "pointRefused",
        (): boolean =>
          hasViolation(
            failure(
              stageLights([{ node: "flame", type: "point", intensity: 1 }]),
            ),
            "type",
            "$input.lights[0].position",
          ),
      ],
      [
        "spotRefused",
        (): boolean =>
          hasViolation(
            failure(
              stageLights([
                {
                  node: "lamp",
                  type: "spot",
                  direction: { x: 0, y: -1, z: 0 },
                  intensity: 1,
                },
              ]),
            ),
            "type",
            "$input.lights[0].position",
          ),
      ],
    ]),
    { pointRefused: true, spotRefused: true },
  );

  assertFilmStageLightBoundaries({ stageLights, failure });
}
