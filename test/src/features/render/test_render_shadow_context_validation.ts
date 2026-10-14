import {
  IAutoMovieColor,
  IAutoMovieLight,
  IAutoMovieScene,
  IAutoMovieSceneEnvironment,
  IAutoMovieStageLight,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { stageScene } from "@automovie/engine";
import { validateSceneEnvironment } from "@automovie/engine";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Environment and staging admission refuse enabled point VSM shadows at the original light row. Their supported neighboring policies remain admissible.
 *
 * Scenarios:
 *
 * 1. PCF, its legacy alias, and globally disabled VSM accept a point caster through environment and staging admission.
 * 2. Enabled VSM refuses the same point at its original light path through both boundaries; a noncasting point remains accepted.
 * 3. An invalid earlier light does not shift a later point's contextual diagnostic, and an independent environment scalar error is collected beside it.
 * 4. Invalid shadow discriminators and enabled flags produce their addressed shape errors without invoking the contextual profile with invalid policy.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs real environment and staging admission, refusing enabled point VSM at the original light path while collecting independent environment scalar and policy shape errors.
 * @evidence contracts/testing.md#independent-expectations The supported point-shadow policy admits PCF/legacy alias and disabled VSM but rejects enabled point VSM; hand-authored source rows determine exact located paths. Boundary agreement is shared-policy consistency, not an independent native shadow-format oracle.
 * @evidence contracts/testing.md#distinguishing-cases Supported and enabled-VSM twins, noncasting lights, an earlier malformed row, invalid policy fields and negative environment intensity preserve acceptance, refusal and diagnostic coexistence.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_shadow_context_validation owns its cases. Portable Engine admission through existing input factories, without shader compilation, framebuffer creation or a real render host.
 */
export function test_render_shadow_context_validation(): void {
  const shadow: {
    mapSize: number;
    bias: number;
    normalBias: number;
    near: number;
    far: number;
  } = {
    mapSize: 256,
    bias: 0,
    normalBias: 0,
    near: 0.1,
    far: 100,
  };
  const point: IAutoMovieLight = {
    id: "lamp",
    type: "point",
    range: 0,
    transform: {
      translation: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 1,
    castShadow: true,
    shadow,
  };
  const placement: IAutoMovieStageLight = {
    node: "lamp",
    role: "key",
    type: "point",
    range: 0,
    position: { x: 0, y: 2, z: 0 },
    intensity: 1,
    castShadow: true,
    shadow,
  };
  const base: IAutoMovieSceneEnvironment = {
    image: null,
    background: null,
    intensity: 1,
    rotationDeg: 0,
    exposure: 1,
    toneMapping: "none",
    shadows: { enabled: true, type: "pcf" },
  };
  const scene: IAutoMovieScene = {
    id: "studio",
    name: null,
    nodes: [],
    cameras: [],
    lights: [point],
  };
  for (const policy of [
    { enabled: true, type: "pcf" },
    { enabled: true, type: "pcfSoft" },
    { enabled: false, type: "vsm" },
  ] satisfies IAutoMovieSceneEnvironment["shadows"][]) {
    const environment: {
      shadows:
        | { enabled: true; type: "pcf" }
        | { enabled: true; type: "pcfSoft" }
        | { enabled: false; type: "vsm" };
      image: string | null;
      background: IAutoMovieColor | null;
      intensity: number;
      rotationDeg: number;
      exposure: number;
      toneMapping: "none" | "acesFilmic";
    } = { ...base, shadows: policy };
    TestValidator.equals(
      "supported environment policy",
      validateSceneEnvironment({
        environment,
        lights: [point],
      }).success,
      true,
    );
    TestValidator.equals(
      "supported staged policy",
      stageScene(
        makeScriptWrite(),
        makeStagingWrite({ lights: [placement], environment }),
      ).success,
      true,
    );
  }
  const environment: IAutoMovieSceneEnvironment = {
    ...base,
    shadows: { enabled: true, type: "vsm" },
  };
  const expected: string = "$input.lights[0].castShadow";
  for (const result of [
    validateSceneEnvironment({ environment, lights: [point] }),
    stageScene(
      makeScriptWrite(),
      makeStagingWrite({ lights: [placement], environment }),
    ),
  ]) {
    TestValidator.equals("enabled point VSM is refused", result.success, false);
    TestValidator.predicate(
      "refusal stays on the source light",
      hasViolation(result, "type", expected),
    );
  }
  const noncasting: IAutoMovieLight = {
    ...point,
    castShadow: false,
    shadow: undefined,
  };
  TestValidator.equals(
    "noncasting point supports VSM",
    validateSceneEnvironment({
      lights: [noncasting],
      environment,
    }).success,
    true,
  );
  TestValidator.equals(
    "noncasting staged point supports VSM",
    stageScene(
      makeScriptWrite(),
      makeStagingWrite({
        lights: [{ ...placement, castShadow: false, shadow: undefined }],
        environment,
      }),
    ).success,
    true,
  );
  const malformed: IAutoMovieScene = {
    ...scene,
    lights: [null, { ...point, id: "later" }] as unknown as IAutoMovieLight[],
    environment: { ...environment, intensity: -1 },
  };
  const collected: IAutoMovieValidation = validateSceneEnvironment({
    environment: malformed.environment!,
    lights: malformed.lights,
  });
  TestValidator.predicate(
    "later point retains its original row",
    hasViolation(collected, "type", "$input.lights[1].castShadow"),
  );
  TestValidator.predicate(
    "environment scalar keeps its own root",
    hasViolation(collected, "range", "$input.intensity"),
  );
  for (const [shadows, path] of [
    [{ enabled: "yes", type: "vsm" }, "$input.shadows.enabled"],
    [{ enabled: true, type: "unknown" }, "$input.shadows.type"],
  ] as const) {
    const invalid: IAutoMovieSceneEnvironment = {
      ...base,
      shadows,
    } as unknown as IAutoMovieSceneEnvironment;
    const result: IAutoMovieValidation = validateSceneEnvironment({
      environment: invalid,
      lights: scene.lights,
    });
    TestValidator.predicate(
      "invalid policy is refused at its field",
      hasViolation(result, "type", path),
    );
  }
}
