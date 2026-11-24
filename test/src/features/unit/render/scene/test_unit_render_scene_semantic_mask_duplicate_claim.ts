import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import {
  type IAutoMovieRenderSubject,
  IAutoMovieSceneNode,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../../../internal/createSemanticMaskTestInputs";
import { throwsError } from "../../../internal/predicates";
import { modelsFixture, sceneFixture } from "../../../internal/renderFixtures";

/**
 * Distinct drawable claimants cannot reuse one semantic identity.
 *
 * Scenarios:
 * 1. A staged yard node and the same-named ground refuse as duplicate node:yard claimants.
 * 2. The adjacent staged node without a same-named ground remains addressable.
 */
export function test_unit_render_scene_semantic_mask_duplicate_claim(): void {
  const {
    bulk,
  }: {
    subject: () => IAutoMovieRenderSubject;
    bulk: (semantic: string) => IAutoMovieSceneNode;
    broken: (owner: string) => IAutoMovieSemanticMask;
    cyclic: () => IAutoMovieSemanticMask;
  } = createSemanticMaskTestInputs();

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

  const adjacent: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [bulk("node:yard")] },
    models: modelsFixture(),
  });
  TestValidator.equals(
    "a lone yard claimant remains addressable",
    adjacent.entries.map(
      (entry: IAutoMovieSemanticMaskEntry): string => entry.id,
    ),
    ["node:yard"],
  );
}
