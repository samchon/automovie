import type {
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderFinding,
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { leaflessPlantingRecipeFixture } from "../internal/leaflessPlantingRecipeFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { modelsFixture } from "../internal/renderFixtures";
import { simulatedRenderBudgetFixture as budget } from "../internal/simulatedRenderBudgetFixture";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { simulatedRenderTargetFixture } from "../internal/simulatedRenderTargetFixture";
import { plantingCluster } from "../internal/softFixtures";

/**
 * An unstated planting prototype leaves geometry unknown while batching remains exact.
 *
 * Scenarios:
 *
 * 1. The branch batch retains instance slots and draws; geometry metrics are not-run with the planting remedy.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures a planting without reported prototype geometry and evaluates its budget, checking null geometry totals, exact batch and slot counts, all three not-run gaps, incomplete status and an owner-naming recovery; this catches unknown shape reported as zero or batching discarded with it.
 * @evidence contracts/testing.md#independent-expectations A three-level binary recipe has seven branches per each of six members, independent of the unstated branch mesh. One branch batch submitted in beauty and outline explains two draws, while absent prototype vertex/triangle facts cannot determine geometry totals or bytes; no measured output supplies expected values.
 * @evidence contracts/testing.md#distinguishing-cases The missing prototype separates known one-node batching from unknown triangles, vertices and geometry bytes, and the report must retain all three gaps and a planting remedy. Positive supplied prototypes and malformed count refusals belong to the simulated budget and invalid-input tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_simulated_unknown_prototype entry synchronously measures and evaluates records in-process, without creating a plant mesh, native buffer, renderer, consumer installation or simulation task; no dynamic test registration is used.
 */
export function test_render_simulated_unknown_prototype(): void {
  const target: IAutoMovieRenderTarget = simulatedRenderTargetFixture();
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;
  const bareRecipe: typeof leaflessPlantingRecipeFixture =
    leaflessPlantingRecipeFixture;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES: number = 7 * 6;

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES: 2 = 2 as const;

  const unstated: IAutoMovieRenderInventory = measure({
    scene: scene(),
    models: modelsFixture(),
    plantings: [
      {
        domain: bareRecipe(),
        cluster: plantingCluster(),
        owner: null,
        branchMaterial: null,
        leafMaterial: null,
        branch: null,
        leaf: null,
      },
    ],
  });

  const unstatedReport: IAutoMovieRenderReport = report(
    unstated,
    budget(),
    target,
  );

  TestValidator.equals(
    "an unstated prototype leaves geometry unmeasured and the batching exact",
    {
      triangles: unstated.totals.triangles,
      vertices: unstated.totals.vertices,
      geometryBytes: unstated.totals.geometryBytes,
      drawCalls: unstated.totals.drawCalls,
      instanceSlots: unstated.totals.instanceSlots,
      nodes: unstated.totals.nodes,
      gaps: unstated.gaps.map((gap: IAutoMovieRenderAnalysisGap): string[] => [
        gap.metric,
        gap.status,
      ]),
      statuses: unstatedReport.findings
        .filter((finding: IAutoMovieRenderFinding): boolean =>
          ["triangles", "vertices", "geometryBytes"].includes(finding.metric),
        )
        .map(
          (
            finding: IAutoMovieRenderFinding,
          ): IAutoMovieRenderFinding["status"] => finding.status,
        ),
      remedies: unstatedReport.findings
        .filter(
          (finding: IAutoMovieRenderFinding): boolean =>
            finding.metric === "triangles",
        )
        .every((finding: IAutoMovieRenderFinding): boolean =>
          (finding.recovery ?? "").includes("atrium-bed"),
        ),
      report: unstatedReport.status,
    },
    {
      triangles: null,
      vertices: null,
      geometryBytes: null,
      // The one branch batch, submitted once per pass. An unmeasured prototype
      // costs an unknown number of triangles, never an unknown number of
      // draws: the batch is submitted whatever it turns out to contain.
      drawCalls: PASSES * 1,
      instanceSlots: BRANCH_INSTANCES,
      nodes: 1,
      gaps: [
        ["triangles", "not-run"],
        ["vertices", "not-run"],
        ["geometryBytes", "not-run"],
      ],
      statuses: ["not-run", "not-run", "not-run"],
      remedies: true,
      report: "incomplete",
    },
  );
}
