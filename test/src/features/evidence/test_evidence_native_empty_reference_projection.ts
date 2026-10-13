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
 *
 * Companion removal neither invents targets nor mutates an empty inventory.
 *
 * Scenarios:
 * 1. A frozen empty reference array remains empty in a new projection record.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `projectAutoMovieNativeReferences` on a frozen empty reference array and asserts an empty result, an unchanged input, and a result that is not the input array; it catches a projection that invents a default companion target for an empty inventory, returns the caller's frozen array so a later push would throw or alias, or writes into the submitted list.
 * @evidence contracts/testing.md#independent-expectations An empty output follows from the documented per-reference mapping over zero references, and array identity is compared with `!==`; nothing about non-empty mapping is asserted here.
 * @evidence contracts/testing.md#distinguishing-cases Boundary of the empty inventory only; non-empty claim lists, mixed severities and claim order belong to `test_evidence_native_claim_projection`, and scalar references to `test_evidence_native_scalar_companion_removal`.
 */
export const test_evidence_native_empty_reference_projection = (): void => {
  const empty: readonly ITtscEvidenceGraphReference[] = Object.freeze([]);
  const projected = projection.projectAutoMovieNativeReferences(empty);
  TestValidator.equals("empty references stay empty", projected, []);
  TestValidator.equals("submitted inventory stays empty", empty, []);
  TestValidator.predicate("projection owns its array", projected !== empty);
};
