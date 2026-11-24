import { IAutoMovieCompiledEffect } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../../../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../../../internal/measureRenderBudgetSubject";
import { namedFacts, throwsError } from "../../../internal/predicates";
import { renderBudgetSubjectFixture } from "../../../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../../../internal/renderBudgetTargetFixture";
import {
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../../../internal/renderFixtures";
import { renderReportBudgetFixture } from "../../../internal/renderReportBudgetFixture";

/**
 * Malformed budget and population records refuse at their actual violated boundary.
 *
 * Scenarios:
 *
 * 1. Negative and fractional limits, absent models, missing LOD and invalid particle caps name their refusal.
 */
export function test_unit_render_scene_budget_invalid_inputs(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> =
    renderReportBudgetFixture();

  const inventory: ReturnType<typeof measure> = measure(subject());

  const effect: IAutoMovieCompiledEffect = {
    id: "haze",
    recipe: { budget: { maxParticles: 5 } },
  } as unknown as IAutoMovieCompiledEffect;

  TestValidator.equals(
    "malformed budgets and unmeasurable subjects are each refused at their own message",
    namedFacts([
      [
        "negative limit",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof report> =>
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
        (): boolean =>
          throwsError(
            (): ReturnType<typeof report> =>
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
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ scene: sceneFixture(), models: [] }),
            'model "wall-model" is absent',
          ),
      ],
      [
        "prototype without level of detail",
        (): boolean =>
          throwsError((): ReturnType<typeof measure> => {
            const set: ReturnType<typeof instanceSetFixture> =
              instanceSetFixture({
                id: "windows",
                count: 1,
                chunks: 1,
              });
            set.prototypes = [
              {
                id: "bare",
                model: "window",
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
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
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
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
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
}
