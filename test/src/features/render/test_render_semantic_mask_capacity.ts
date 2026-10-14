import { IAutoMovieSceneNode, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { IAutoMovieRenderSubject } from "../../../../packages/engine/src/render/IAutoMovieRenderSubject";
import { assertAutoMovieSemanticMaskCapacity } from "../../../../packages/engine/src/render/assertAutoMovieSemanticMaskCapacity";
import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "../../../../packages/engine/src/render/constants/AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";
import { deriveAutoMovieSemanticMask } from "../../../../packages/engine/src/render/deriveAutoMovieSemanticMask";
import { TestValidator } from "@nestia/e2e";
import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
import { throwsError } from "../internal/predicates";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";
/**
 * The actual producer's admission accepts 65536 entity claims and rejects 65537 without truncation. Counts are nonnegative safe integers supplied by the producer's claim-array length.
 *
 * Scenarios:
 * 1. Empty, single, one-below-limit and exact-limit counts are accepted by the same admission used before palette and slot allocation.
 * 2. 65537 and a larger exact safe count refuse with the original capacity diagnostic. This is count admission and does not claim a full-size render.
 * 3. The real derivation consumer accepts empty and single-node subjects and retains the node's stable identity through palette allocation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual derivation admission and producer, checking inclusive capacity and explicit excess refusal without allocating fabricated full-size scene collections.
 * @evidence contracts/testing.md#independent-expectations The declared 65536 entity bound independently determines accepted 65535/65536 and refused 65537/MAX_SAFE counts; expected messages retain that count. Direct count admission does not prove complete maximum-size scene derivation, memory use or rendered coverage.
 * @evidence contracts/testing.md#distinguishing-cases Empty, singleton, just-below, exact and excessive counts retain boundary witnesses; real empty and one-node subjects separately prove consumer reach, while compact-slot fallback is owned elsewhere.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_capacity owns its cases. Portable direct-source capacity and small actual producer calls, without a full-size renderer or palette image.
 */
export function test_render_semantic_mask_capacity(): void {
  TestValidator.equals(
    "the semantic product retains its 65536-entry declared bound",
    AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES,
    65_536,
  );
  for (const entities of [0, 1, 65_535, 65_536])
    TestValidator.equals(
      `capacity admits ${entities} entity claims`,
      assertAutoMovieSemanticMaskCapacity(entities),
      undefined,
    );
  for (const entities of [65_537, Number.MAX_SAFE_INTEGER])
    TestValidator.predicate(
      `capacity refuses ${entities} without truncation`,
      throwsError(
        (): void => assertAutoMovieSemanticMaskCapacity(entities),
        [`needs ${entities} entries`, "above the bounded maximum 65536"],
      ),
    );
  const { bulk }: { subject: () => IAutoMovieRenderSubject; bulk: (semantic: string) => IAutoMovieSceneNode; broken: (owner: string) => IAutoMovieSemanticMask; cyclic: () => IAutoMovieSemanticMask; } = createSemanticMaskTestInputs();
  const empty: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [] },
    models: modelsFixture(),
  });
  const single: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene: { ...sceneFixture(), nodes: [bulk("node:one")] },
    models: modelsFixture(),
  });
  TestValidator.equals(
    "the real producer reaches admission and retains supported populations",
    {
      empty: empty.entries,
      singleIds: single.entries.map((entry: IAutoMovieSemanticMaskEntry): string => entry.id),
      gaps: single.unaddressed,
    },
    { empty: [], singleIds: ["node:one"], gaps: [] },
  );
}
