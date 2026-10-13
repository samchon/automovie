import { TestValidator } from "@nestia/e2e";
import { BOX_GEOMETRY_BYTES, BOX_TRIANGLES, BOX_VERTICES } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { renderBudgetFindingShape } from "../internal/renderBudgetFindingShape";

/**
 * The staged inventory and its admitted budget preserve independent box, instance and mip arithmetic.
 *
 * Scenarios:
 *
 * 1. The staged world reports each metric and fits its declared limits.
 */
export const test_render_budget_report = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const inventory = measure(subject());

  // 5 staged boxes and 12 instanced boxes; one shadow-casting light repeats
  // the 8 opaque draws (5 nodes + 3 chunks) once; a mipmapped 512x512 RGBA
  // texture has ten levels: 4 * (4^10 - 1) / 3 bytes; five distinct box models are five
  // times the documented per-box byte cost.
  TestValidator.equals(
    "the inventory matches hand arithmetic on every metric",
    inventory.totals,
    {
      triangles: 2 * (5 * BOX_TRIANGLES + 12 * BOX_TRIANGLES),
      vertices: 5 * BOX_VERTICES + 12 * BOX_VERTICES,
      drawCalls: (5 + 3) * 2,
      materials: 2,
      textures: 4,
      textureBytes: (4 * (4 ** 10 - 1)) / 3 + 1024 + 512 * 512 * (4 + 4),
      geometryBytes: 5 * BOX_GEOMETRY_BYTES,
      lights: 2,
      shadowMaps: 1,
      nodes: 5,
      instanceSets: 1,
      instanceSlots: 12,
      instanceChunks: 3,
      fluidCells: 0,
      fluidParticles: 0,
    },
  );

  TestValidator.equals(
    "the finest level of detail and the chunk draw bound are attributed to the set",
    inventory.instanceSets,
    [
      {
        instanceSet: "windows",
        slots: 12,
        chunks: 3,
        prototypes: 1,
        drawCallUpperBound: 3,
      },
    ],
  );

  TestValidator.equals(
    "a model cited only by one level-of-detail tier reports that tier",
    inventory.models.map((cost) => [cost.model, cost.tier]),
    [
      ["door-model", null],
      ["prop-model", null],
      ["slab-model", null],
      ["wall-model", null],
      ["window-model", "near"],
    ],
  );

  const clear = report(inventory, budget, target);
  TestValidator.equals("within findings have no overrun recovery", renderBudgetFindingShape(
    clear.findings.find((finding) => finding.metric === "textureBytes")!,
  ).recovers, false);

  TestValidator.equals(
    "an artifact inside its budget clears with one finding per metric",
    {
      status: clear.status,
      tier: clear.tier,
      metrics: clear.findings.map((finding) => finding.metric),
      statuses: [...new Set(clear.findings.map((finding) => finding.status))],
      excess: clear.findings.every((finding) => finding.excess === 0),
      recovery: clear.findings.every((finding) => finding.recovery === null),
    },
    {
      status: "within",
      tier: "review",
      // Spelled out rather than read from the constant: an expectation taken
      // from the value under test cannot notice the value changing.
      metrics: [
        "triangles",
        "vertices",
        "drawCalls",
        "materials",
        "textures",
        "textureBytes",
        "geometryBytes",
        "lights",
        "shadowMaps",
        "nodes",
        "instanceSets",
        "instanceSlots",
        "instanceChunks",
        "fluidCells",
        "fluidParticles",
      ],
      statuses: ["within"],
      excess: true,
      recovery: true,
    },
  );
};
