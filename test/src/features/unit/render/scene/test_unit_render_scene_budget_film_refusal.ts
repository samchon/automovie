import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieRenderBudget,
  IAutoMovieRenderBudgetAssessment,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";
import {
  assessAutoMovieRenderBudget,
  autoMovieRenderTargetRendererOfGraphics,
  autoMovieRenderTargetSettingsOfShot,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import {
  GRAPHICS_FIXTURE,
  RENDER_BUDGET_ASSETS,
  compiledShotFixture,
  renderBudgetFixture,
} from "../../../internal/renderBudgetFixtures";

/**
 * A shot whose film stage targets exceed the texture-byte budget is refused by
 * the render budget preflight, which counts them from the film it is handed.
 *
 * The shot is an empty room with a medium, delivered at 1920 × 1080 and drawn
 * into its 3840 × 2160 beauty drawing buffer; the film's optics set a shutter
 * with 16 samples and its shading asks for occlusion. The budget allows 256 MiB
 * of texture memory.
 *
 * Scenarios:
 *
 * 1. Assessed without its film, the shot is within the budget: it allocates no
 *    film stage target.
 * 2. Assessed with its film, the shot is over the budget on `textureBytes`, and
 *    the finding's omitted cost, where runtime storage is accounted rather than
 *    ranked as an editable owner, holds at least the two sample sums.
 */
export function test_unit_render_scene_budget_film_refusal(): void {
  const compiled: IAutoMovieCompiledShotSource = compiledShotFixture({
    scene: {
      id: "room",
      name: null,
      nodes: [],
      cameras: [],
      lights: [],
      medium: { scattering: 0.05, absorption: 0, anisotropy: 0.3 },
    },
    models: [],
  });
  const settings: IAutoMovieRenderTargetSettings =
    autoMovieRenderTargetSettingsOfShot({
      compiled,
      width: 3840,
      height: 2160,
      pixelRatio: 1,
      delivery: "acesFilmic",
    });
  const budget: IAutoMovieRenderBudget = renderBudgetFixture({
    tier: "delivery",
    limits: {
      triangles: 1_000_000,
      vertices: 1_000_000,
      drawCalls: 1000,
      materials: 100,
      textures: 100,
      textureBytes: 256 * 1024 * 1024,
      geometryBytes: 100_000_000,
      lights: 8,
      shadowMaps: 4,
      nodes: 100,
      instanceSets: 4,
      instanceSlots: 1000,
      instanceChunks: 100,
      fluidCells: 0,
      fluidParticles: 0,
    },
  });
  const assess: (filmed: boolean) => IAutoMovieRenderBudgetAssessment = (
    filmed: boolean,
  ): IAutoMovieRenderBudgetAssessment =>
    assessAutoMovieRenderBudget({
      compiled,
      shot: "room",
      budget,
      renderer: autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE),
      settings,
      assets: RENDER_BUDGET_ASSETS,
      ...(filmed
        ? {
            film: {
              optics: {
                ev100: 8,
                toneMapping: "acesFilmic",
                shutter: { angle: 180 },
                samples: 16,
              },
              shading: { occlusion: { radius: 0.5 } },
            },
          }
        : {}),
    });

  // 1. Without the film.
  TestValidator.equals(
    "the room without its film is within the budget",
    assess(false).status,
    "within",
  );

  // 2. With the film.
  const filmed: IAutoMovieRenderBudgetAssessment = assess(true);
  const finding:
    | NonNullable<
        IAutoMovieRenderBudgetAssessment["report"]
      >["findings"][number]
    | undefined = filmed.report?.findings.find(
    (
      entry: NonNullable<
        IAutoMovieRenderBudgetAssessment["report"]
      >["findings"][number],
    ): boolean => entry.metric === "textureBytes",
  );
  TestValidator.predicate(
    "the film's targets put the room over its texture-byte budget",
    filmed.status === "over" &&
      finding?.status === "over" &&
      (finding.omittedCost ?? 0) >= 2 * 3840 * 2160 * 16,
  );
}
