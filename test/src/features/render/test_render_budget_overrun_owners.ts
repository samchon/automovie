import { AutoMovieRenderMetric, IAutoMovieRenderInventory, IAutoMovieRenderReport } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { BOX_TRIANGLES } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { renderBudgetFindingShape as shape } from "../internal/renderBudgetFindingShape";

/**
 * Over-limit twins identify the dominant editable resource while retaining repeated pass cost.
 *
 * Scenarios:
 *
 * 1. Triangle, draw, texture, shadow, instance and fluid overruns name their exact excess and owner.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates six one-metric over-limit twins and asserts each finding's status, exact excess, dominant editable owner/source/cost and recovery presence, catching attribution to a repeated frame pass instead of authored resources.
 * @evidence contracts/testing.md#independent-expectations Original staged/instance populations, unit-box counts, RGBA mip texel sum and declared shadow/fluid storage determine literal arithmetic. Only the selected metric limit changes, and expected owner paths are authored addresses rather than report-derived values.
 * @evidence contracts/testing.md#distinguishing-cases Preserves triangle, draw, texture-byte, shadow-map, instance-slot and fluid-cell overruns with repeated pass costs retained; unbudgeted, malformed, unknown storage and contributor truncation are separate cases.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_overrun_owners owns the six portable CPU inventory/report twins through existing fixtures and shape projection; no renderer, texture allocation, fluid host or GPU is started.
 */
export function test_render_budget_overrun_owners(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> = renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> = renderReportBudgetFixture();

  const inventory: ReturnType<typeof measure> = measure(subject());

  // Over-limit twins: one metric at a time, every other limit untouched, so a
  // failure names the metric that actually broke.
  const twin: (metric: AutoMovieRenderMetric, over: IAutoMovieRenderInventory, limit: number) => IAutoMovieRenderReport["findings"][number] = (
    metric: AutoMovieRenderMetric,
    over: IAutoMovieRenderInventory,
    limit: number,
  ): IAutoMovieRenderReport["findings"][number] =>
    report(
      over,
      { ...budget, limits: { ...budget.limits, [metric]: limit } },
      target,
    ).findings.find((finding: IAutoMovieRenderReport["findings"][number]): boolean => finding.metric === metric)!;

  const fluid: ReturnType<typeof measure> = measure({
    ...subject(),
    waterBodies: [
      {
        id: "atrium-pool",
        owner: "space:tower/ground-hall",
        nodes: [],
        cells: 4096,
        particles: 512,
        domain: null,
        material: null,
      },
    ],
  });

  TestValidator.equals(
    "every budgeted cost has an over-limit twin naming its dominant owner",
    {
      triangles: shape(twin("triangles", inventory, 100)),
      drawCalls: shape(twin("drawCalls", inventory, 15)),
      textureBytes: shape(twin("textureBytes", inventory, 1000)),
      shadowMaps: shape(twin("shadowMaps", inventory, 0)),
      instanceSlots: shape(twin("instanceSlots", inventory, 11)),
      fluidCells: shape(twin("fluidCells", fluid, 4000)),
    },
    {
      // The shadow pass is in the measurement and out of the ranking: it
      // redraws the 204 opaque triangles the owners below already paid for, so
      // its aggregate cost cannot be allowed to lead the editable-owner
      // complexity ranking. The window band is the largest owner's own cost.
      triangles: {
        status: "over",
        excess: 308,
        owner: "instance-set:windows",
        source: 'world.instanceSets["windows"]',
        cost: 12 * BOX_TRIANGLES,
        recovers: true,
      },
      drawCalls: {
        status: "over",
        excess: 1,
        owner: "instance-set:windows",
        source: 'world.instanceSets["windows"]',
        cost: 3,
        recovers: true,
      },
      textureBytes: {
        status: "over",
        excess: (4 * (4 ** 10 - 1)) / 3 + 1024 + 512 * 512 * (4 + 4) - 1000,
        owner: "texture:textures/stone.png",
        source: 'assets["textures/stone.png"]',
        cost: (4 * (4 ** 10 - 1)) / 3,
        recovers: true,
      },
      shadowMaps: {
        status: "over",
        excess: 1,
        owner: "light:sun",
        source: 'scene.lights["sun"]',
        cost: 1,
        recovers: true,
      },
      instanceSlots: {
        status: "over",
        excess: 1,
        owner: "instance-set:windows",
        source: 'world.instanceSets["windows"]',
        cost: 12,
        recovers: true,
      },
      fluidCells: {
        status: "over",
        excess: 96,
        owner: "water-body:atrium-pool",
        source: 'waterBodies["atrium-pool"]',
        cost: 4096,
        recovers: true,
      },
    },
  );
}
