import type { AutoMovieViolationKind, IAutoMovieConstraintViolation, IAutoMovieSceneEnvironment, IAutoMovieStage, IAutoMovieStageLight, IAutoMovieValidation } from "@automovie/interface";

import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { validateSceneEnvironment } from "../../../../packages/engine/src/validation/validateSceneEnvironment";

import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const ENVIRONMENT: IAutoMovieSceneEnvironment = {
  image: "assets/studio.hdr",
  background: null,
  intensity: 0.8,
  rotationDeg: 35,
  exposure: 1.1,
  toneMapping: "acesFilmic",
  shadows: { enabled: true, type: "pcfSoft" },
};

function refusedAt (
  environment: unknown,
  kind: AutoMovieViolationKind,
  path: string,
): boolean {
  const result: IAutoMovieValidation = validateSceneEnvironment({
    environment: environment as IAutoMovieSceneEnvironment,
  });
  return result.success === false && hasViolation(result, kind, path);
}

function stagedWith (environment: unknown): IAutoMovieStagedSet { return stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      environment: environment as IAutoMovieSceneEnvironment,
    }),
  ); }

/**
 * Environment and shadow settings are validated before they reach Three.js.
 *
 * Scenarios:
 *
 * 1. A complete image environment and shadowed light lower without losing any
 *    renderer-independent setting, while omitted environment data preserves the
 *    legacy scene shape.
 * 2. Every environment scalar, color, enum, exclusivity, and nested-object
 *    boundary fails at its authored path, with valid zero and extreme values
 *    retained.
 * 3. Shadow casting and deterministic shadow settings are declared together;
 *    malformed, missing, or inactive settings are refused before lowering.
 * 4. Backgrounds and staged lights reject an RGB/hex contradiction through
 *    the same color gate and retain matching endpoint swatches.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises validateSceneEnvironment and stageScene and asserts authored environment preservation, renderer-policy and shadow-field refusals plus shared background/light color consistency; catches a stage accepting a swatch inconsistent with the numeric color it renders.
 * @evidence contracts/testing.md#independent-expectations Environment and shadow domains come from their interface contracts, and exact white/black sRGB endpoints define the independent color oracle; tests require located authored fields rather than reading runtime enum tables.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted and complete environments, malformed nested records, scalar/enum/renderer boundaries, shadow declaration/settings consistency and matching/mismatched background/light labels; model and fog entries exercise the other color consumers separately.
 * @evidence contracts/testing.md#execution-ownership The synchronous unit entry owns the fixed cases and the shadow case table, calls portable source validators and stageScene, and starts no real renderer or host.
 */
export function test_film_stage_scene_environment (): void {
  const staged: IAutoMovieStagedSet = stagedWith(ENVIRONMENT);
  TestValidator.equals("valid environment stages", staged.success, true);
  if (staged.success === true)
    TestValidator.predicate(
      "environment lowers verbatim",
      staged.scene.environment === ENVIRONMENT,
    );
  const bare: IAutoMovieStagedSet = stageScene(makeScriptWrite(), makeStagingWrite());
  TestValidator.equals(
    "omitted environment preserves legacy scene bytes",
    namedFacts([
      ["staged", () : boolean => bare.success === true],
      [
        "noKey",
        () : boolean =>
          // The `success` comparison is restated only to narrow the union
          // inside this closure.
          bare.success === true && !("environment" in bare.scene),
      ],
    ]),
    { staged: true, noKey: true },
  );

  const color: { r: number; g: number; b: number; a: null; hex: null; } = { r: 0.1, g: 0.2, b: 0.3, a: null, hex: null };
  TestValidator.equals(
    "every environment gate is located",
    namedFacts([
      ["object", () : boolean => refusedAt(null, "type", "$input")],
      [
        "imageType",
        () : boolean => refusedAt({ ...ENVIRONMENT, image: 4 }, "type", "$input.image"),
      ],
      [
        "imageBlank",
        () : boolean => refusedAt({ ...ENVIRONMENT, image: " " }, "type", "$input.image"),
      ],
      [
        "background",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, image: null, background: 2 },
            "type",
            "$input.background",
          ),
      ],
      [
        "backgroundWithImage",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, background: color },
            "type",
            "$input.background",
          ),
      ],
      [
        "red",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, image: null, background: { ...color, r: -1 } },
            "range",
            "$input.background.r",
          ),
      ],
      [
        "green",
        () : boolean =>
          refusedAt(
            {
              ...ENVIRONMENT,
              image: null,
              background: { ...color, g: Infinity },
            },
            "range",
            "$input.background.g",
          ),
      ],
      [
        "blue",
        () : boolean =>
          refusedAt(
            {
              ...ENVIRONMENT,
              image: null,
              background: { ...color, b: "blue" },
            },
            "range",
            "$input.background.b",
          ),
      ],
      [
        "alpha",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, image: null, background: { ...color, a: 2 } },
            "range",
            "$input.background.a",
          ),
      ],
      [
        "hex",
        () : boolean =>
          refusedAt(
            {
              ...ENVIRONMENT,
              image: null,
              background: { ...color, hex: "red" },
            },
            "type",
            "$input.background.hex",
          ),
      ],
      [
        "intensity",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, intensity: -1 },
            "range",
            "$input.intensity",
          ),
      ],
      [
        "rotation",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, rotationDeg: NaN },
            "range",
            "$input.rotationDeg",
          ),
      ],
      [
        "exposure",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, exposure: 0 },
            "range",
            "$input.exposure",
          ),
      ],
      [
        "tone",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, toneMapping: "linear" },
            "type",
            "$input.toneMapping",
          ),
      ],
      [
        "shadows",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, shadows: null },
            "type",
            "$input.shadows",
          ),
      ],
      [
        "enabled",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, shadows: { enabled: 1, type: "pcf" } },
            "type",
            "$input.shadows.enabled",
          ),
      ],
      [
        "shadowType",
        () : boolean =>
          refusedAt(
            { ...ENVIRONMENT, shadows: { enabled: true, type: "hard" } },
            "type",
            "$input.shadows.type",
          ),
      ],
    ]),
    {
      object: true,
      imageType: true,
      imageBlank: true,
      background: true,
      backgroundWithImage: true,
      red: true,
      green: true,
      blue: true,
      alpha: true,
      hex: true,
      intensity: true,
      rotation: true,
      exposure: true,
      tone: true,
      shadows: true,
      enabled: true,
      shadowType: true,
    },
  );

  TestValidator.predicate(
    "solid background and renderer extremes validate",
    validateSceneEnvironment({
      environment: {
        ...ENVIRONMENT,
        image: null,
        background: color,
        intensity: 0,
        rotationDeg: -720,
        exposure: Number.MIN_VALUE,
        toneMapping: "none",
        shadows: { enabled: false, type: "vsm" },
      },
    }).success,
  );

  const standard: IAutoMovieStage = makeStagingWrite();
  const light: IAutoMovieStageLight = { node: "key", type: "directional", direction: { x: -1, y: -1, z: 0 }, intensity: 1 };
  const shadowed: IAutoMovieStagedSet = stageScene(makeScriptWrite(), {
    ...standard,
    lights: [
      {
        ...light,
        castShadow: true,
        shadow: {
          mapSize: 1024,
          bias: -0.0001,
          normalBias: 0.02,
          near: 0.1,
          far: 200,
        },
      },
    ],
  });
  TestValidator.equals(
    "shadow declaration lowers onto the scene light",
    namedFacts([
      ["staged", () : boolean => shadowed.success === true],
      [
        "castShadow",
        () : boolean =>
          shadowed.success === true &&
          shadowed.scene.lights[0]?.castShadow === true,
      ],
      [
        "mapSize",
        () : boolean =>
          shadowed.success === true &&
          shadowed.scene.lights[0]?.shadow?.mapSize === 1024,
      ],
    ]),
    { staged: true, castShadow: true, mapSize: true },
  );

  const invalidShadowCases: Array<[unknown, string]> = [
    [{ ...light, castShadow: "yes" }, "$input.lights[0].castShadow"],
    [{ ...light, castShadow: true }, "$input.lights[0].shadow"],
    [{ ...light, shadow: null }, "$input.lights[0].shadow"],
    [
      {
        ...light,
        castShadow: false,
        shadow: { mapSize: 1, bias: 0, normalBias: 0, near: 1, far: 2 },
      },
      "$input.lights[0].shadow",
    ],
    [
      {
        ...light,
        shadow: { mapSize: 0, bias: 0, normalBias: 0, near: 1, far: 2 },
      },
      "$input.lights[0].shadow.mapSize",
    ],
    [
      {
        ...light,
        shadow: { mapSize: 1, bias: NaN, normalBias: 0, near: 1, far: 2 },
      },
      "$input.lights[0].shadow.bias",
    ],
    [
      {
        ...light,
        shadow: { mapSize: 1, bias: 0, normalBias: Infinity, near: 1, far: 2 },
      },
      "$input.lights[0].shadow.normalBias",
    ],
    [
      {
        ...light,
        shadow: { mapSize: 1, bias: 0, normalBias: 0, near: 0, far: 2 },
      },
      "$input.lights[0].shadow.near",
    ],
    [
      {
        ...light,
        shadow: { mapSize: 1, bias: 0, normalBias: 0, near: 2, far: 2 },
      },
      "$input.lights[0].shadow.far",
    ],
  ];
  TestValidator.predicate(
    "invalid shadow fields fail at their authored paths",
    invalidShadowCases.every(([candidate, path]: [unknown, string]) : boolean => {
      const result: IAutoMovieStagedSet = stageScene(makeScriptWrite(), {
        ...standard,
        lights: [candidate as typeof light],
      });
      return (
        result.success === false &&
        hasViolation(
          result,
          path.endsWith("castShadow") || path.endsWith("shadow")
            ? "type"
            : "range",
          path,
        )
      );
    }),
  );
  const mismatchBackground: IAutoMovieValidation = validateSceneEnvironment({ environment: { ...ENVIRONMENT, image: null, background: { r: 0, g: 0, b: 0, a: null, hex: "#FFFFFF" } } });
  TestValidator.predicate("background cannot label black as white", mismatchBackground.success === false && mismatchBackground.violations.some((item: IAutoMovieConstraintViolation): boolean => item.path === "$input.background.hex" && item.expected.includes("encoded as #000000")));
  const mismatchLight: IAutoMovieStagedSet = stageScene(makeScriptWrite(), { ...standard, lights: [{ ...light, color: { r: 0, g: 0, b: 0, a: null, hex: "#FFFFFF" } }] });
  TestValidator.predicate("a staged light cannot label black as white", mismatchLight.success === false && mismatchLight.violations.some((item: IAutoMovieConstraintViolation): boolean => item.path === "$input.lights[0].color.hex" && item.expected.includes("encoded as #000000")));
  TestValidator.equals("matching light endpoint labels remain admitted", stageScene(makeScriptWrite(), { ...standard, lights: [{ ...light, color: { r: 1, g: 1, b: 1, a: null, hex: "#FFFFFF" } }] }).success, true);
}
