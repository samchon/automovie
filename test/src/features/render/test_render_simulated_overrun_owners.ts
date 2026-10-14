import type {
  IAutoMovieRenderBudget,
  IAutoMovieRenderFinding,
  IAutoMovieRenderInventory,
  IAutoMovieRenderTarget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { simulatedRenderBudgetFixture as budget } from "../internal/simulatedRenderBudgetFixture";
import { simulatedRenderSubjectFixture } from "../internal/simulatedRenderSubjectFixture";
import { simulatedRenderTargetFixture } from "../internal/simulatedRenderTargetFixture";

/**
 * Simulated resource overruns rank editable drawables while retaining full frame-pass cost.
 *
 * Scenarios:
 *
 * 1. Triangle, draw, instance and fluid limits report exact excess, independent owners and complete accounting.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the real composed simulated inventory and evaluates four one-limit budget twins, checking exact excess, dominant editable owner and source, recovery ownership, complete contributor accounting and exclusion of frame-pass rows from ranked edits; this catches an omitted simulated cost or a pass replacing its editable cause.
 * @evidence contracts/testing.md#independent-expectations Panel and water grid topology give twelve and four triangles, and seven branches times six members at the authored twenty-four-triangle prototype give the planting cost. Two submissions determine triangle/draw excess, while forty-two resident slots and six fluid cells determine the other excesses; equal one-draw owners are ordered by their documented ids.
 * @evidence contracts/testing.md#distinguishing-cases Triangle, draw, slot and fluid twins lower one limit each while preserving the shared inventory and remaining limits. They distinguish submitted work from resident counts, largest-own-cost ranking from equal-cost id ordering, and complete accounting from pass-free editable ranking. Within-budget and unknown-input states have separate simulated tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test_render_simulated_overrun_owners entry owns four synchronous report twins through numerical engine seams; it starts no renderer, native resource, simulation frame, process or installed consumer.
 */
export function test_render_simulated_overrun_owners(): void {
  const target: IAutoMovieRenderTarget = simulatedRenderTargetFixture();
  const subject: typeof simulatedRenderSubjectFixture =
    simulatedRenderSubjectFixture;

  const PANEL_TRIANGLES: 12 = 12 as const;

  const WATER_TRIANGLES: 4 = 4 as const;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES: number = 7 * 6;

  const BRANCH: { vertices: number; triangles: number } = {
    vertices: 40,
    triangles: 24,
  };

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES: 2 = 2 as const;

  const inventory: IAutoMovieRenderInventory = measure(subject());

  const twin: (
    metric: keyof IAutoMovieRenderBudget["limits"],
    over: IAutoMovieRenderInventory,
    limit: number,
  ) => Record<string, unknown> = (
    metric: keyof IAutoMovieRenderBudget["limits"],
    over: IAutoMovieRenderInventory,
    limit: number,
  ): Record<string, unknown> => {
    const finding: IAutoMovieRenderFinding = report(
      over,
      { ...budget(), limits: { ...budget().limits, [metric]: limit } },
      target,
    ).findings.find(
      (item: IAutoMovieRenderFinding): boolean => item.metric === metric,
    )!;
    return {
      status: finding.status,
      excess: finding.excess,
      owner: finding.contributors[0]?.owner,
      source: finding.contributors[0]?.source,
      recovers: (finding.recovery ?? "").includes(
        finding.contributors[0]?.owner ?? "!",
      ),
      // The listed owners plus what the report leaves unnamed are still the
      // whole measurement, pass included.
      accounted:
        finding.contributors.reduce(
          (
            sum: number,
            entry: IAutoMovieRenderFinding["contributors"][number],
          ): number => sum + entry.cost,
          0,
        ) +
          finding.omittedCost ===
        finding.measured,
      // Whatever else the recovery says, it never sends an author to a pass.
      editable: finding.contributors.every(
        (entry: IAutoMovieRenderFinding["contributors"][number]): boolean =>
          !entry.owner.startsWith("render-pass:"),
      ),
    };
  };

  TestValidator.equals(
    "an over-limit simulated cost names the drawable and the record to edit",
    {
      triangles: twin("triangles", inventory, 100),
      drawCalls: twin("drawCalls", inventory, 2),
      instanceSlots: twin("instanceSlots", inventory, 41),
      fluidCells: twin("fluidCells", inventory, 5),
    },
    {
      // The extra pass draws every opaque triangle again, so its cost is the
      // sum of every drawable and it would lead the ranking of the two metrics
      // a pass multiplies for as long as it was ranked at all. It is not a
      // record this production declares. `IAutoMovieRenderBudget` has no pass
      // to turn off, so the ranking is over the drawables and the pass is
      // counted among the owners the report does not name. Instance slots and
      // fluid cells are resident rather than submitted and never had a pass to
      // outrank them.
      triangles: {
        status: "over",
        excess:
          PASSES *
            (PANEL_TRIANGLES +
              BRANCH_INSTANCES * BRANCH.triangles +
              WATER_TRIANGLES) -
          100,
        owner: "planting:atrium-bed",
        source: 'plantings["atrium-bed"]',
        recovers: true,
        accounted: true,
        editable: true,
      },
      // Three drawables, one draw each, so the ranking is decided on the owner
      // id and the bed sorts first.
      drawCalls: {
        status: "over",
        excess: PASSES * 3 - 2,
        owner: "planting:atrium-bed",
        source: 'plantings["atrium-bed"]',
        recovers: true,
        accounted: true,
        editable: true,
      },
      instanceSlots: {
        status: "over",
        excess: 1,
        owner: "planting:atrium-bed",
        source: 'plantings["atrium-bed"]',
        recovers: true,
        accounted: true,
        editable: true,
      },
      fluidCells: {
        status: "over",
        excess: 1,
        owner: "water-body:atrium-pool",
        source: 'waterBodies["atrium-pool"]',
        recovers: true,
        accounted: true,
        editable: true,
      },
    },
  );
}
