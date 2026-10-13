import {
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";
import {
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Distinct drawable claimants cannot reuse one semantic identity.
 *
 * Scenarios:
 * 1. A staged yard node and the same-named ground refuse as duplicate node:yard claimants.
 * 2. The adjacent staged node without a same-named ground remains addressable.
 */
export const test_render_semantic_mask_duplicate_claim = (): void => {
  const { bulk } = createSemanticMaskTestInputs();

  TestValidator.equals(
      "two claimants of one semantic id are refused rather than silently merged",
      throwsError(
        () =>
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

  const adjacent = deriveAutoMovieSemanticMask({ scene: { ...sceneFixture(), nodes: [bulk("node:yard")] }, models: modelsFixture() });
  TestValidator.equals("a lone yard claimant remains addressable", adjacent.entries.map(entry => entry.id), ["node:yard"]);
};
