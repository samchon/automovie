import { AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/predicates";
import { BOX_TRIANGLES, modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * Contributor limits retain the complete measured cost without treating ordinary nodes as instances.
 *
 * Scenarios:
 *
 * 1. Fifty owners retain ranked and omitted accounting; caller bounds admit positive integers and refuse zero or fractional values.
 */
export const test_render_budget_contributor_bounds = (): void => {
  const target = renderBudgetTargetFixture();
  const budget = renderReportBudgetFixture();

  const crowd = measure({
    scene: {
      ...sceneFixture(),
      nodes: Array.from({ length: 50 }, (_, index) => ({
        id: `prop-${index}`,
        model: "prop-model",
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        motion: null,
        pose: null,
      })),
    },
    models: modelsFixture(),
  });

  const bounded = report(
    crowd,
    { ...budget, limits: { triangles: 1 } },
    target,
  ).findings.find((finding) => finding.metric === "triangles")!;

  TestValidator.equals(
    "fifty owners produce a bounded finding with a counted remainder",
    {
      contributors: bounded.contributors.length,
      omittedContributors: bounded.omittedContributors,
      omittedCost: bounded.omittedCost,
      accounted:
        bounded.contributors.reduce((sum, entry) => sum + entry.cost, 0) +
        bounded.omittedCost,
      measured: bounded.measured,
      ordered: bounded.contributors.every(
        (entry, index) =>
          index === 0 ||
          bounded.contributors[index - 1]!.cost > entry.cost ||
          (bounded.contributors[index - 1]!.cost === entry.cost &&
            bounded.contributors[index - 1]!.owner < entry.owner),
      ),
    },
    {
      contributors: AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS,
      // The fifty props past the bound, plus the shadow pass, which is never
      // ranked however small the production is.
      omittedContributors: 50 - AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS + 1,
      omittedCost:
        (50 - AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS) * BOX_TRIANGLES +
        50 * BOX_TRIANGLES,
      // The listed owners plus the omitted cost are still the whole
      // measurement, so leaving the pass out of the ranking dropped nothing.
      accounted: 2 * 50 * BOX_TRIANGLES,
      measured: 2 * 50 * BOX_TRIANGLES,
      ordered: true,
    },
  );

  TestValidator.equals(
    "fifty ordinary nodes report no instanced slots at all",
    {
      nodes: crowd.totals.nodes,
      instanceSlots: crowd.totals.instanceSlots,
      instanceSets: crowd.totals.instanceSets,
      instanceChunks: crowd.totals.instanceChunks,
    },
    { nodes: 50, instanceSlots: 0, instanceSets: 0, instanceChunks: 0 },
  );

  TestValidator.equals(
    "the contributor bound is caller-tunable and validated",
    {
      tight: report(crowd, budget, target, 2).findings.find(
        (finding) => finding.metric === "triangles",
      )!.contributors.length,
      zero: throwsError(
        () => report(crowd, budget, target, 0),
        "positive safe integer",
      ),
      fractional: throwsError(
        () => report(crowd, budget, target, 1.5),
        "positive safe integer",
      ),
    },
    { tight: 2, zero: true, fractional: true },
  );
};
