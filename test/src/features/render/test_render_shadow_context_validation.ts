import { stageScene, validateSceneEnvironment } from "@automovie/engine";
import type {
  IAutoMovieLight,
  IAutoMovieScene,
  IAutoMovieSceneEnvironment,
  IAutoMovieStageLight,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateSceneArtifact } from "@automovie/production/validation";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Every scene admission boundary refuses an enabled point VSM shadow before
 * rendering, without moving its diagnostic under the environment or changing
 * the light's original row. Supported neighboring policies remain admissible.
 *
 * Scenarios:
 *
 * 1. PCF, its legacy alias, and globally disabled VSM accept a point caster
 *    through environment, portable scene and staging admission.
 * 2. Enabled VSM refuses the same point at its original light path through
 *    all three boundaries; a noncasting point remains accepted.
 * 3. An invalid earlier light does not shift a later point's diagnostic, and
 *    an independent environment scalar error is collected beside it.
 * 4. Invalid shadow discriminators and enabled flags produce their addressed
 *    shape errors without invoking the contextual profile with invalid policy.
 */
export const test_render_shadow_context_validation = (): void => {
  const shadow = {
    mapSize: 256, bias: 0, normalBias: 0, near: 0.1, far: 100,
  };
  const point: IAutoMovieLight = {
    id: "lamp", type: "point", range: 0,
    transform: {
      translation: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 1, g: 1, b: 1, a: null, hex: null },
    intensity: 1, castShadow: true, shadow,
  };
  const placement: IAutoMovieStageLight = {
    node: "lamp", role: "key", type: "point", range: 0,
    position: { x: 0, y: 2, z: 0 }, intensity: 1,
    castShadow: true, shadow,
  };
  const base: IAutoMovieSceneEnvironment = {
    image: null, background: null, intensity: 1, rotationDeg: 0,
    exposure: 1, toneMapping: "none", shadows: { enabled: true, type: "pcf" },
  };
  const scene: IAutoMovieScene = {
    id: "studio", name: null, nodes: [], cameras: [], lights: [point],
  };
  for (const policy of [
    { enabled: true, type: "pcf" },
    { enabled: true, type: "pcfSoft" },
    { enabled: false, type: "vsm" },
  ] satisfies IAutoMovieSceneEnvironment["shadows"][]) {
    const environment = { ...base, shadows: policy };
    TestValidator.equals("supported environment policy", validateSceneEnvironment({
      environment, lights: [point],
    }).success, true);
    TestValidator.equals("supported portable scene policy", validateSceneArtifact({
      ...scene, environment,
    }, []).success, true);
    TestValidator.equals("supported staged policy", stageScene(
      makeScriptWrite(), makeStagingWrite({ lights: [placement], environment }),
    ).success, true);
  }
  const environment: IAutoMovieSceneEnvironment = {
    ...base, shadows: { enabled: true, type: "vsm" },
  };
  const expected = "$input.lights[0].castShadow";
  for (const result of [
    validateSceneEnvironment({ environment, lights: [point] }),
    validateSceneArtifact({ ...scene, environment }, []),
    stageScene(makeScriptWrite(), makeStagingWrite({ lights: [placement], environment })),
  ]) {
    TestValidator.equals("enabled point VSM is refused", result.success, false);
    TestValidator.predicate("refusal stays on the source light", hasViolation(
      result, "type", expected,
    ));
  }
  const noncasting: IAutoMovieLight = { ...point, castShadow: false, shadow: undefined };
  TestValidator.equals("noncasting point supports VSM", validateSceneArtifact({
    ...scene, lights: [noncasting], environment,
  }, []).success, true);
  TestValidator.equals("noncasting staged point supports VSM", stageScene(
    makeScriptWrite(), makeStagingWrite({
      lights: [{ ...placement, castShadow: false, shadow: undefined }], environment,
    }),
  ).success, true);
  const malformed: IAutoMovieScene = {
    ...scene,
    lights: [null, { ...point, id: "later" }] as unknown as IAutoMovieLight[],
    environment: { ...environment, intensity: -1 },
  };
  const collected = validateSceneArtifact(malformed, []);
  TestValidator.predicate("earlier malformed light remains addressed", hasViolation(
    collected, "type", "$input.lights[0]",
  ));
  TestValidator.predicate("later point retains its original row", hasViolation(
    collected, "type", "$input.lights[1].castShadow",
  ));
  TestValidator.predicate("environment scalar keeps its own root", hasViolation(
    collected, "range", "$input.environment.intensity",
  ));
  for (const [shadows, path] of [
    [{ enabled: "yes", type: "vsm" }, "$input.environment.shadows.enabled"],
    [{ enabled: true, type: "unknown" }, "$input.environment.shadows.type"],
  ] as const) {
    const invalid = { ...base, shadows } as unknown as IAutoMovieSceneEnvironment;
    const result = validateSceneArtifact({ ...scene, environment: invalid }, []);
    TestValidator.predicate("invalid policy is refused at its field", hasViolation(
      result, "type", path,
    ));
  }
};
