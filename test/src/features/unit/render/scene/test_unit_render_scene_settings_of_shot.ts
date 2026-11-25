import {
  assessAutoMovieRenderBudget,
  autoMovieRenderTargetSettingsOfShot,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCompiledShotSourceFixture } from "../../../internal/createCompiledShotSourceFixture";

/**
 * `autoMovieRenderTargetSettingsOfShot` reads a shot's render target from its
 * environment, and `assessAutoMovieRenderBudget` refuses a verdict without a
 * renderer.
 *
 * Scenarios:
 *
 * 1. A shot without an environment takes the delivery tone mapping, exposure 1
 *    and no shadows.
 * 2. An environment with shadows on takes its tone mapping, exposure and shadow
 *    type; one with shadows off has none.
 * 3. An assessment with no graphics identity is `not-run`, with a reason and no
 *    report, inventory, mask or target.
 */
export function test_unit_render_scene_settings_of_shot(): void {
  const settings = (environment: Parameters<typeof createCompiledShotSourceFixture>[0]) =>
    autoMovieRenderTargetSettingsOfShot({
      compiled: createCompiledShotSourceFixture(environment),
      width: 640,
      height: 360,
      pixelRatio: 2,
      delivery: "acesFilmic",
    });
  TestValidator.equals("no environment", settings(null), {
    width: 640,
    height: 360,
    pixelRatio: 2,
    shadows: false,
    shadowType: "none",
    toneMapping: "acesFilmic",
    exposure: 1,
  });
  const environment = (enabled: boolean) => ({
    image: null,
    background: null,
    intensity: 1,
    rotationDeg: 0,
    exposure: 0.5,
    toneMapping: "none" as const,
    shadows: { enabled, type: "vsm" as const },
  });
  TestValidator.equals("shadows on", settings(environment(true)), {
    width: 640,
    height: 360,
    pixelRatio: 2,
    shadows: true,
    shadowType: "vsm",
    toneMapping: "none",
    exposure: 0.5,
  });
  TestValidator.equals("shadows off", settings(environment(false)).shadows, false);

  const assessment = assessAutoMovieRenderBudget({
    compiled: createCompiledShotSourceFixture(),
    shot: "shot:fixture",
    budget: null,
    renderer: null,
    settings: settings(null),
    assets: [],
  });
  TestValidator.equals(
    "not run",
    [
      assessment.shot,
      assessment.status,
      assessment.report,
      assessment.inventory,
      assessment.mask,
      assessment.target,
      assessment.reason !== null,
    ],
    ["shot:fixture", "not-run", null, null, null, null, true],
  );
}