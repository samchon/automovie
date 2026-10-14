import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { renderBudgetFindingShape } from "../internal/renderBudgetFindingShape";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import {
  BOX_GEOMETRY_BYTES,
  BOX_TRIANGLES,
  BOX_VERTICES,
} from "../internal/renderFixtures";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";

/**
 * The staged inventory and its admitted budget preserve independent box, instance and mip arithmetic.
 *
 * Scenarios:
 *
 * 1. The staged world reports each metric and fits its declared limits.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the staged world and evaluates its budget, asserting every inventory total, instance-set draw bound, sorted model/tier attribution and complete within-status metric list with zero excess and no recovery. Missing resource or frame-pass costs cannot hide behind the overall verdict.
 * @evidence contracts/testing.md#independent-expectations Five staged plus twelve instanced boxes give literal geometry arithmetic, eight opaque draws repeat for one shadow caster, the 512-square RGBA mip chain sums 4*(4^10-1)/3 bytes and declared resident profiles add 1024 plus the shadow color/depth storage. Expected metric order and model/tier pairs are authored separately from production output/constants.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the supported populated world, shared instanced prototype, one shadow caster, decoded mip texture and fully admitted budget across all fifteen metrics. Missing resources, overruns, absent budgets and ranked truncation belong to their dedicated budget tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_report owns portable synchronous inventory/report semantics via shared fixtures; these byte/count estimates allocate no native renderer resources and do not measure actual GPU residency or frame time.
 */
export function test_render_budget_report(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> =
    renderReportBudgetFixture();

  const inventory: ReturnType<typeof measure> = measure(subject());

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
    inventory.models.map(
      (
        cost: ReturnType<typeof measure>["models"][number],
      ): [string, typeof cost.tier] => [cost.model, cost.tier],
    ),
    [
      ["door-model", null],
      ["prop-model", null],
      ["slab-model", null],
      ["wall-model", null],
      ["window-model", "near"],
    ],
  );

  const clear: ReturnType<typeof report> = report(inventory, budget, target);
  TestValidator.equals(
    "within findings have no overrun recovery",
    renderBudgetFindingShape(
      clear.findings.find(
        (finding: ReturnType<typeof report>["findings"][number]): boolean =>
          finding.metric === "textureBytes",
      )!,
    ).recovers,
    false,
  );

  TestValidator.equals(
    "an artifact inside its budget clears with one finding per metric",
    {
      status: clear.status,
      tier: clear.tier,
      metrics: clear.findings.map(
        (
          finding: ReturnType<typeof report>["findings"][number],
        ): typeof finding.metric => finding.metric,
      ),
      statuses: [
        ...new Set(
          clear.findings.map(
            (
              finding: ReturnType<typeof report>["findings"][number],
            ): typeof finding.status => finding.status,
          ),
        ),
      ],
      excess: clear.findings.every(
        (finding: ReturnType<typeof report>["findings"][number]): boolean =>
          finding.excess === 0,
      ),
      recovery: clear.findings.every(
        (finding: ReturnType<typeof report>["findings"][number]): boolean =>
          finding.recovery === null,
      ),
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
}
