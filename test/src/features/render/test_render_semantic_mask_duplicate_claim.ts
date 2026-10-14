import { IAutoMovieSceneNode, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { IAutoMovieRenderSubject } from "../../../../packages/engine/src/render/IAutoMovieRenderSubject";
import { deriveAutoMovieSemanticMask } from "../../../../packages/engine/src/render/deriveAutoMovieSemanticMask";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/predicates";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
/**
 * Distinct drawable claimants cannot reuse one semantic identity.
 *
 * Scenarios:
 * 1. A staged yard node and the same-named ground refuse as duplicate node:yard claimants.
 * 2. The adjacent staged node without a same-named ground remains addressable.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual claim derivation and refuses two drawable claimants of node:yard while retaining the adjacent sole staged claimant.
 * @evidence contracts/testing.md#independent-expectations A staged yard node and a ground with id yard both declare the same semantic identity; uniqueness requires the explicit duplicate diagnostic, independently of assigned colours. The single-node twin must remain addressable.
 * @evidence contracts/testing.md#distinguishing-cases Duplicate staged/ground ownership contrasts with a lone yard node; colour collisions between different ids and general capacity have separate owning tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_duplicate_claim owns its cases. Portable claim admission over resident records, without drawing either claimant or installing a renderer.
 */
export function test_render_semantic_mask_duplicate_claim(): void {
  const { bulk }: { subject: () => IAutoMovieRenderSubject; bulk: (semantic: string) => IAutoMovieSceneNode; broken: (owner: string) => IAutoMovieSemanticMask; cyclic: () => IAutoMovieSemanticMask; } = createSemanticMaskTestInputs();

  TestValidator.equals(
      "two claimants of one semantic id are refused rather than silently merged",
      throwsError(
        (): IAutoMovieSemanticMask =>
          deriveAutoMovieSemanticMask({
            scene: {
              ...sceneFixture(),
              nodes: [bulk("node:yard")],
              space: { id: "yard", surfaces: [], walkable: [] },
            },
            models: modelsFixture(),
          }),
        'two claimants of "node:yard"',
      ),
      true,
    );

  const adjacent: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({ scene: { ...sceneFixture(), nodes: [bulk("node:yard")] }, models: modelsFixture() });
  TestValidator.equals("a lone yard claimant remains addressable", adjacent.entries.map((entry: IAutoMovieSemanticMaskEntry): string => entry.id), ["node:yard"]);
}
