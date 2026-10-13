import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const projection = loadSourceModule<{
  projectAutoMovieNativeReferences: (
    references: readonly ITtscEvidenceGraphReference[],
  ) => ITtscEvidenceGraphReference[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/evidence/src/projectAutoMovieNativeClaims.ts",
  ),
);

/**
 * Companion removal neither invents targets nor mutates an empty inventory.
 *
 * Scenarios:
 * 1. A frozen empty reference array remains empty in a new projection record.
 */
export const test_evidence_native_empty_reference_projection = (): void => {
  const empty: readonly ITtscEvidenceGraphReference[] = Object.freeze([]);
  const projected = projection.projectAutoMovieNativeReferences(empty);
  TestValidator.equals("empty references stay empty", projected, []);
  TestValidator.equals("submitted inventory stays empty", empty, []);
  TestValidator.predicate("projection owns its array", projected !== empty);
};
