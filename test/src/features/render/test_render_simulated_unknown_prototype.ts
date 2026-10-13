import { TestValidator } from "@nestia/e2e";
import { modelsFixture } from "../internal/renderFixtures";
import { plantingCluster } from "../internal/softFixtures";
import { simulatedRenderTargetFixture } from "../internal/simulatedRenderTargetFixture";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { leaflessPlantingRecipeFixture } from "../internal/leaflessPlantingRecipeFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { simulatedRenderBudgetFixture as budget } from "../internal/simulatedRenderBudgetFixture";

/**
 * An unstated planting prototype leaves geometry unknown while batching remains exact.
 *
 * Scenarios:
 *
 * 1. The branch batch retains instance slots and draws; geometry metrics are not-run with the planting remedy.
 */
export const test_render_simulated_unknown_prototype = (): void => {
  const target = simulatedRenderTargetFixture();
  const scene = simulatedRenderSceneFixture;
  const bareRecipe = leaflessPlantingRecipeFixture;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES = 7 * 6;

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES = 2;

  const unstated = measure({
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

  const unstatedReport = report(unstated, budget(), target);

  TestValidator.equals(
    "an unstated prototype leaves geometry unmeasured and the batching exact",
    {
      triangles: unstated.totals.triangles,
      vertices: unstated.totals.vertices,
      geometryBytes: unstated.totals.geometryBytes,
      drawCalls: unstated.totals.drawCalls,
      instanceSlots: unstated.totals.instanceSlots,
      nodes: unstated.totals.nodes,
      gaps: unstated.gaps.map((gap) => [gap.metric, gap.status]),
      statuses: unstatedReport.findings
        .filter((finding) =>
          ["triangles", "vertices", "geometryBytes"].includes(finding.metric),
        )
        .map((finding) => finding.status),
      remedies: unstatedReport.findings
        .filter((finding) => finding.metric === "triangles")
        .every((finding) => (finding.recovery ?? "").includes("atrium-bed")),
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
};
