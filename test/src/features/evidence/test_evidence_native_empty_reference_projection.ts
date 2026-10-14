import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";

import { projectAutoMovieNativeReferences } from "../../../../packages/evidence/src/projectAutoMovieNativeReferences";

/**
 * Companion removal neither invents targets nor mutates an empty inventory.
 *
 * Scenarios:
 *
 * 1. A frozen empty reference array remains empty in a distinct result array.
 *
 * @evidence contracts/testing.md#behavioral-verification Projects a frozen empty reference inventory and asserts empty input and output plus a distinct result array, catching invented targets, mutation or aliasing.
 * @evidence contracts/testing.md#independent-expectations The empty inventory contract independently requires no targets and caller-owned output; literal empty arrays and reference inequality do not depend on an implementation snapshot.
 * @evidence contracts/testing.md#distinguishing-cases This case owns the empty boundary with frozen input and distinct output; populated graph-reference projection and matching semantics are owned by adjacent native-reference tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry directly imports the source projector and owns its empty-array case without installing a consumer, compiling a native artifact or starting a process, browser or renderer.
 */
export function test_evidence_native_empty_reference_projection(): void {
  const empty: readonly ITtscEvidenceGraphReference[] = Object.freeze([]);
  const projected: ITtscEvidenceGraphReference[] = projectAutoMovieNativeReferences(empty);
  TestValidator.equals("empty references stay empty", projected, []);
  TestValidator.equals("submitted inventory stays empty", empty, []);
  TestValidator.predicate("projection owns its array", projected !== empty);
}
