import { IAutoMovieRenderBudget, IAutoMovieRenderInventory } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { simulatedRenderTargetFixture } from "../internal/simulatedRenderTargetFixture";
import { simulatedRenderSubjectFixture } from "../internal/simulatedRenderSubjectFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { simulatedRenderBudgetFixture as budget } from "../internal/simulatedRenderBudgetFixture";

/**
 * Simulated resource overruns rank editable drawables while retaining full frame-pass cost.
 *
 * Scenarios:
 *
 * 1. Triangle, draw, instance and fluid limits report exact excess, independent owners and complete accounting.
 */
export const test_render_simulated_overrun_owners = (): void => {
  const target = simulatedRenderTargetFixture();
  const subject = simulatedRenderSubjectFixture;

  const PANEL_TRIANGLES = 12;

  const WATER_TRIANGLES = 4;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES = 7 * 6;

  const BRANCH = { vertices: 40, triangles: 24 };

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES = 2;

  const inventory = measure(subject());

  const twin = (
    metric: keyof IAutoMovieRenderBudget["limits"],
    over: IAutoMovieRenderInventory,
    limit: number,
  ): Record<string, unknown> => {
    const finding = report(
      over,
      { ...budget(), limits: { ...budget().limits, [metric]: limit } },
      target,
    ).findings.find((item) => item.metric === metric)!;
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
        finding.contributors.reduce((sum, entry) => sum + entry.cost, 0) +
          finding.omittedCost ===
        finding.measured,
      // Whatever else the recovery says, it never sends an author to a pass.
      editable: finding.contributors.every(
        (entry) => !entry.owner.startsWith("render-pass:"),
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
};
