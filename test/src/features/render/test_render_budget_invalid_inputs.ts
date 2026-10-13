import { IAutoMovieCompiledEffect } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, throwsError } from "../internal/predicates";
import { instanceSetFixture, modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * Malformed budget and population records refuse at their actual violated boundary.
 *
 * Scenarios:
 *
 * 1. Negative and fractional limits, absent models, missing LOD and invalid particle caps name their refusal.
 */
export const test_render_budget_invalid_inputs = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const inventory = measure(subject());

  const effect = {
    id: "haze",
    recipe: { budget: { maxParticles: 5 } },
  } as unknown as IAutoMovieCompiledEffect;

  TestValidator.equals(
    "malformed budgets and unmeasurable subjects are each refused at their own message",
    namedFacts([
      [
        "negative limit",
        () =>
          throwsError(
            () =>
              report(
                inventory,
                { ...budget, limits: { triangles: -1 } },
                target,
              ),
            "at or above zero",
          ),
      ],
      [
        "fractional limit",
        () =>
          throwsError(
            () =>
              report(
                inventory,
                { ...budget, limits: { triangles: 1.5 } },
                target,
              ),
            "at or above zero",
          ),
      ],
      [
        "absent model",
        () =>
          throwsError(
            () => measure({ scene: sceneFixture(), models: [] }),
            'model "wall-model" is absent',
          ),
      ],
      [
        "prototype without level of detail",
        () =>
          throwsError(() => {
            const set = instanceSetFixture({
              id: "windows",
              count: 1,
              chunks: 1,
            });
            set.prototypes = [
              {
                id: "bare",
                modelRecipe: "window",
                weight: 1,
                lod: [],
                projectionRadius: 1,
              },
            ];
            return measure({
              scene: sceneFixture(),
              models: modelsFixture(),
              instanceSets: [set],
            });
          }, "declares no level of detail"),
      ],
      [
        "zero effect cap",
        () =>
          throwsError(
            () =>
              measure({
                scene: { ...sceneFixture(), nodes: [], lights: [] },
                models: modelsFixture(),
                effects: [
                  {
                    ...effect,
                    recipe: { budget: { maxParticles: 0 } },
                  } as unknown as IAutoMovieCompiledEffect,
                ],
              }),
            "maxParticles must be a positive safe integer",
          ),
      ],
      [
        "fractional effect cap",
        () =>
          throwsError(
            () =>
              measure({
                scene: { ...sceneFixture(), nodes: [], lights: [] },
                models: modelsFixture(),
                effects: [
                  {
                    ...effect,
                    recipe: { budget: { maxParticles: 1.5 } },
                  } as unknown as IAutoMovieCompiledEffect,
                ],
              }),
            "maxParticles must be a positive safe integer",
          ),
      ],
    ]),
    {
      "negative limit": true,
      "fractional limit": true,
      "absent model": true,
      "prototype without level of detail": true,
      "zero effect cap": true,
      "fractional effect cap": true,
    },
  );
};
