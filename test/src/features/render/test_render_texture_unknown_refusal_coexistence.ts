import {
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";

/**
 * Over-limit recovery never suppresses an independent required native texture
 * uncertainty. Normal render evidence retains both owning diagnostics.
 *
 * Scenarios:
 *
 * 1. Supported, over-only and unknown-only shots retain their existing outcomes.
 * 2. One shot that is both over and unknown reports both conditions.
 * 3. Separate over and unknown shots keep each shot/asset identity in one refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes the actual compiled-shot assessment, evidence reduction and refusal formatter to verify that an over-budget verdict preserves an independent unknown-texture diagnostic.
 * @evidence contracts/testing.md#independent-expectations A nonempty box exceeds the explicit zero-triangle limit; expected null admission, over status and shot/asset/message fragments come from the authored cases rather than another formatter.
 * @evidence contracts/testing.md#distinguishing-cases Preserves supported, over-only, unknown-only, same-shot combined and separate-shot combined cases so either verdict precedence or dropped diagnostic scope is visible.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous metadata assessment of a deliberately partial compiled-shot fixture; the portable runner executes it, and supplied renderer identity does not establish native drawing or automatic render-job refusal.
 */
export function test_render_texture_unknown_refusal_coexistence(): void {
  const model: ReturnType<typeof boxModel> = boxModel({
    id: "model",
    materials: [material("surface", "image")],
  });
  const scene: ReturnType<typeof sceneFixture> = {
    ...sceneFixture(),
    lights: [],
    nodes: [{ ...sceneFixture().nodes[0], model: model.id }],
  };
  const compiled: ReturnType<typeof compiledShotFixture> = compiledShotFixture({
    models: [model],
    scene,
  });
  const assess: (
    shot: string,
    over: boolean,
    known: boolean,
  ) => ReturnType<typeof assessAutoMovieRenderBudget> = (
    shot: string,
    over: boolean,
    known: boolean,
  ): ReturnType<typeof assessAutoMovieRenderBudget> =>
    assessAutoMovieRenderBudget({
      compiled,
      shot,
      budget: over
        ? { version: 1, tier: "unit", limits: { triangles: 0 } }
        : null,
      renderer: {
        api: "webgl2",
        vendor: "typed-unit",
        device: "no-gpu-observation",
      },
      settings: {
        width: 64,
        height: 64,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "none",
        exposure: 1,
      },
      assets: [],
      textures: [
        {
          asset: "image",
          width: 4,
          height: 4,
          format: "rgba8",
          mipmapped: false,
          allocationStateKnown: known,
        },
      ],
    });
  const refusal: (
    ...assessments: ReturnType<typeof assess>[]
  ) => string | null = (
    ...assessments: ReturnType<typeof assess>[]
  ): string | null =>
    autoMovieRenderBudgetRefusal(
      autoMovieRenderBudgetEvidence({
        tier: "unit",
        budgets: undefined,
        assessments,
      }),
    );
  const supported: ReturnType<typeof assess> = assess("supported", false, true);
  const over: ReturnType<typeof assess> = assess("known-over", true, true);
  const unknown: ReturnType<typeof assess> = assess(
    "unknown-shot",
    false,
    false,
  );
  TestValidator.equals(
    "supported no-limit admission",
    refusal(supported),
    null,
  );
  TestValidator.predicate(
    "over-only recovery remains",
    refusal(over)!.includes("known-over") &&
      refusal(over)!.includes("over budget"),
  );
  TestValidator.predicate(
    "unknown-only diagnostics remain",
    refusal(unknown)!.includes("unknown-shot") &&
      refusal(unknown)!.includes("image"),
  );
  const both: ReturnType<typeof assess> = assess("both-shot", true, false);
  TestValidator.equals(
    "over decision precedence stays intact",
    both.status,
    "over",
  );
  const same: string = refusal(both)!;
  TestValidator.predicate(
    "same-shot retains over and required unknown diagnostics",
    same.includes("both-shot") &&
      same.includes("over budget") &&
      same.includes("no safe resident texture") &&
      same.includes("image"),
  );
  const separate: string = refusal(over, unknown)!;
  TestValidator.predicate(
    "separate scopes retain both owning failures",
    separate.includes("known-over") &&
      separate.includes("unknown-shot") &&
      separate.includes("image") &&
      separate.includes("over budget") &&
      separate.includes("no safe resident texture"),
  );
}
