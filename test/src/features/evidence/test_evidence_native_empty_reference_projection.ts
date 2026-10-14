import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const projection: { projectAutoMovieNativeReferences: (references: readonly ITtscEvidenceGraphReference[]) => ITtscEvidenceGraphReference[]; } = loadSourceModule<{
  projectAutoMovieNativeReferences: (
    references: readonly ITtscEvidenceGraphReference[],
  ) => ITtscEvidenceGraphReference[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/evidence/src/projectAutoMovieNativeReferences.ts",
  ),
);

/**
 * Companion removal neither invents targets nor mutates an empty inventory.
 *
 * Scenarios:
 * 1. A frozen empty reference array remains empty in a new projection record.
 *
 * @evidence contracts/testing.md#behavioral-verification Projects a frozen empty reference inventory and asserts empty input and output plus a distinct result array, catching invented targets, mutation or aliasing.
 * @evidence contracts/testing.md#independent-expectations The empty inventory contract independently requires no targets and caller-owned output; literal empty arrays and reference inequality do not depend on an implementation snapshot.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the empty boundary with frozen input and distinct output; populated graph-reference projection and matching semantics are owned by adjacent native-reference tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry reaches the source projector through the existing typed module fixture and starts no consumer, process, browser or native renderer.
 */
export function test_evidence_native_empty_reference_projection(): void {
  const empty: readonly ITtscEvidenceGraphReference[] = Object.freeze([]);
  const projected: ITtscEvidenceGraphReference[] = projection.projectAutoMovieNativeReferences(empty);
  TestValidator.equals("empty references stay empty", projected, []);
  TestValidator.equals("submitted inventory stays empty", empty, []);
  TestValidator.predicate("projection owns its array", projected !== empty);
}
