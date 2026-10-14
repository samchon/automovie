import { sealAutoMovieRenderTarget } from "@automovie/engine";
import {
  assessAutoMovieRenderBudget,
  autoMovieRenderTargetRendererOfGraphics,
  autoMovieRenderTargetSettingsOfShot,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import {
  GRAPHICS_FIXTURE,
  RENDER_BUDGET_ASSETS,
  compiledShotFixture,
  sceneEnvironmentFixture,
} from "../internal/renderBudgetFixtures";
import { sceneFixture } from "../internal/renderFixtures";

/**
 * A budget verdict is bound to the renderer and the settings that produced it,
 * or it is not produced at all.
 *
 * The target is the whole reason a report can go stale instead of silently
 * lying: change the shadow filter, the pixel ratio or the tone curve and the
 * same design costs something else. This test checks the mapper's declared
 * policy; applying it to a real host is a separate responsibility. A host that
 * never told the job what it draws with produces `not-run` rather than a
 * verdict attributed to a fabricated GPU.
 *
 * Scenarios:
 *
 * 1. A capture probe becomes a renderer identity, WebGL's `renderer` spelled as
 *    the target's `device`.
 * 2. A probe withholding vendor and device reports `unknown`; an absent probe
 *    reports `null`, and the two are not the same claim.
 * 3. A shot declaring a render environment takes its curve, exposure and shadow
 *    policy; a shot declaring none keeps the delivery curve at exposure 1 with
 *    no shadow map.
 * 4. An environment that names a filter family and disables shadows records
 *    `none`, the render target's own invariant, so the settings seal instead of
 *    being refused as a contradiction.
 * 5. An assessment with no renderer identity is `not-run`, says why, and carries
 *    no report, inventory, mask or target.
 * 6. Two deliveries of one shot fingerprint differently, which is what makes a
 *    report measured under the other one detectably stale.
 * 7. A shot the preflight cannot measure is refused by its own id, with the
 *    engine's account of the contradiction preserved: none of those refusals
 *    knows which shot it was reading.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual renderer/settings mapping, target sealing and budget preflight; asserts graphics identity spelling, absent/unknown distinction, staged/default/shadowless settings, no-probe refusal payload, delivery-sensitive target identity and a missing-model error naming its shot and cause.
 * @evidence contracts/testing.md#independent-expectations Authored graphics fields map renderer to device, blank fields mean unknown and missing probes mean null. Literal environment exposure 1.5/shadow policy and neutral absent-environment exposure one/no shadows supply expectations; the latter assumes a neutral host and does not prove an arbitrary viewer resets previous state. Repeated versus changed delivery is an identity-preservation oracle, not a GPU measurement.
 * @evidence contracts/testing.md#distinguishing-cases Retains all seven groups including null/undefined/blank probes, present/absent environment, disabled VSM normalized to none, unprobed early return, repeat/changed tone curve and absent-model contextual refusal. Budget thresholds, texture residency and aggregate tier evidence belong to other preflight tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_preflight_target owns portable synchronous mappings and preflight over injected graphics facts. It queries no live graphics device, starts no browser/renderer and proves no actual capture settings or pixels.
 */
export function test_render_budget_preflight_target(): void {
  TestValidator.equals(
    "a capture probe becomes the renderer identity a target is sealed to",
    autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE),
    {
      api: "webgl2",
      vendor: "Google Inc. (Google)",
      device: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
    },
  );
  TestValidator.equals(
    "a withheld field is `unknown`, and an absent probe is `null`",
    {
      withheld: autoMovieRenderTargetRendererOfGraphics({
        api: "  ",
        vendor: "",
        renderer: "   ",
      }),
      absent: autoMovieRenderTargetRendererOfGraphics(null),
      unprobed: autoMovieRenderTargetRendererOfGraphics(undefined),
    },
    {
      withheld: { api: "unknown", vendor: "unknown", device: "unknown" },
      absent: null,
      unprobed: null,
    },
  );

  const settings: (props: {
    environment?: ReturnType<typeof sceneEnvironmentFixture>;
    delivery: "none" | "acesFilmic";
  }) => ReturnType<typeof autoMovieRenderTargetSettingsOfShot> = (props: {
    environment?: ReturnType<typeof sceneEnvironmentFixture>;
    delivery: "none" | "acesFilmic";
  }): ReturnType<typeof autoMovieRenderTargetSettingsOfShot> =>
    autoMovieRenderTargetSettingsOfShot({
      compiled: compiledShotFixture({
        scene: { ...sceneFixture(), environment: props.environment },
      }),
      width: 1280,
      height: 720,
      pixelRatio: 1,
      delivery: props.delivery,
    });
  const stagedSettings: ReturnType<typeof settings> = settings({
    environment: sceneEnvironmentFixture(), delivery: "none",
  });
  const bareSettings: ReturnType<typeof settings> = settings({ delivery: "acesFilmic" });
  TestValidator.predicate(
    "environment/default exposure and pixel ratio match authored policy",
    (): boolean => nclose(stagedSettings.exposure, 1.5, 1e-12) &&
      nclose(bareSettings.exposure, 1, 1e-12) &&
      nclose(stagedSettings.pixelRatio, 1, 1e-12) &&
      nclose(bareSettings.pixelRatio, 1, 1e-12),
  );
  TestValidator.equals(
    "the scene's environment outranks the delivery, and its absence does not",
    {
      staged: { ...stagedSettings, exposure: 1.5, pixelRatio: 1 },
      bare: { ...bareSettings, exposure: 1, pixelRatio: 1 },
    },
    {
      staged: {
        width: 1280,
        height: 720,
        pixelRatio: 1,
        shadows: true,
        shadowType: "pcfSoft",
        toneMapping: "acesFilmic",
        exposure: 1.5,
      },
      bare: {
        width: 1280,
        height: 720,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "acesFilmic",
        exposure: 1,
      },
    },
  );

  const shadowless: ReturnType<typeof settings> = settings({
    environment: sceneEnvironmentFixture({
      shadows: { enabled: false, type: "vsm" },
    }),
    delivery: "none",
  });
  TestValidator.equals(
    "a disabled shadow policy records no filter family and still seals",
    {
      shadows: shadowless.shadows,
      shadowType: shadowless.shadowType,
      sealed: sealAutoMovieRenderTarget({
        renderer: autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE)!,
        settings: shadowless,
        assets: RENDER_BUDGET_ASSETS,
      }).protocol,
    },
    {
      shadows: false,
      shadowType: "none",
      sealed: "automovie.render-target.v1",
    },
  );

  const unprobed: ReturnType<typeof assessAutoMovieRenderBudget> = assessAutoMovieRenderBudget({
    compiled: compiledShotFixture(),
    shot: "opening",
    budget: null,
    renderer: null,
    settings: settings({ delivery: "none" }),
    assets: RENDER_BUDGET_ASSETS,
  });
  TestValidator.equals(
    "a job that never learned its renderer reports `not-run`, not a verdict",
    {
      status: unprobed.status,
      shot: unprobed.shot,
      report: unprobed.report,
      inventory: unprobed.inventory,
      mask: unprobed.mask,
      target: unprobed.target,
      reason: unprobed.reason?.includes("no graphics identity"),
    },
    {
      status: "not-run",
      shot: "opening",
      report: null,
      inventory: null,
      mask: null,
      target: null,
      reason: true,
    },
  );

  const under: (delivery: "none" | "acesFilmic") => ReturnType<typeof assessAutoMovieRenderBudget> = (delivery: "none" | "acesFilmic"): ReturnType<typeof assessAutoMovieRenderBudget> =>
    assessAutoMovieRenderBudget({
      compiled: compiledShotFixture(),
      shot: "opening",
      budget: null,
      renderer: autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE),
      settings: settings({ delivery }),
      assets: RENDER_BUDGET_ASSETS,
    });
  const plain: ReturnType<typeof under> = under("none");
  const repeated: ReturnType<typeof under> = under("none");
  const filmic: ReturnType<typeof under> = under("acesFilmic");
  TestValidator.equals(
    "two deliveries of one shot fingerprint differently",
    {
      same: plain.target!.digest === repeated.target!.digest,
      differs: plain.target!.digest !== filmic.target!.digest,
      reported: filmic.report!.target.settings.toneMapping,
    },
    { same: true, differs: true, reported: "acesFilmic" },
  );

  TestValidator.predicate(
    "a shot the preflight cannot measure is refused by shot id and by cause",
    throwsError(
      (): ReturnType<typeof assessAutoMovieRenderBudget> =>
        assessAutoMovieRenderBudget({
          compiled: compiledShotFixture({
            scene: {
              ...sceneFixture(),
              nodes: [
                {
                  id: "ghost",
                  model: "absent-model",
                  transform: {
                    translation: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                    scale: { x: 1, y: 1, z: 1 },
                  },
                  motion: null,
                  pose: null,
                },
              ],
            },
          }),
          shot: "vault-reveal",
          budget: null,
          renderer: autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE),
          settings: settings({ delivery: "none" }),
          assets: RENDER_BUDGET_ASSETS,
        }),
      [
        'could not measure shot "vault-reveal"',
        'model "absent-model" is absent',
      ],
    ),
  );
}
