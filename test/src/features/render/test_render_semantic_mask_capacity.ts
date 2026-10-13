import {
  AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
import { loadSourceModule } from "../internal/loadSourceModule";
import { throwsError } from "../internal/predicates";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";

const { assertAutoMovieSemanticMaskCapacity } = loadSourceModule<{
  assertAutoMovieSemanticMaskCapacity: (entities: number) => void;
}>(path.resolve(
  __dirname,
  "../../../../packages/engine/src/render/assertAutoMovieSemanticMaskCapacity.ts",
));

/**
 * The actual producer's admission accepts65536 entity claims and rejects65537
 * without truncation. Counts are nonnegative safe integers supplied by the
 * producer's claim-array length, not fabricated array-like scene records.
 *
 * Scenarios:
 * 1. Empty, single, one-below-limit and exact-limit counts are accepted by the
 *    same admission used before palette and slot allocation.
 * 2.65537 and a larger exact safe count refuse with the original capacity
 *    diagnostic. This is count admission and does not claim a full-size render.
 * 3. The real derivation consumer accepts empty and single-node subjects and
 *    retains the node's stable identity through palette allocation.
 */
export const test_render_semantic_mask_capacity = (): void => {
  TestValidator.equals(
    "the semantic product retains its65536-entry declared bound",
    AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
    65_536,
  );
  for (const entities of [0, 1, 65_535, 65_536])
    TestValidator.equals(
      `capacity admits${entities} entity claims`,
      assertAutoMovieSemanticMaskCapacity(entities),
      undefined,
    );
  for (const entities of [65_537, Number.MAX_SAFE_INTEGER])
    TestValidator.predicate(
      `capacity refuses${entities} without truncation`,
      throwsError(
        () => assertAutoMovieSemanticMaskCapacity(entities),
        [`needs ${entities} entries`, "above the bounded maximum 65536"],
      ),
    );
  const { bulk } = createSemanticMaskTestInputs();
  const empty = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [] },
    models: modelsFixture(),
  });
  const single = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [bulk("node:one")] },
    models: modelsFixture(),
  });
  TestValidator.equals(
    "the real producer reaches admission and retains supported populations",
    {
      empty: empty.entries,
      singleIds: single.entries.map((entry) => entry.id),
      gaps: single.unaddressed,
    },
    { empty: [], singleIds: ["node:one"], gaps: [] },
  );
};
