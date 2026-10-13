import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const projection = loadSourceModule<{
  projectAutoMovieNativeClaims: (
    claims: readonly ITtscEvidenceGraphClaim[],
  ) => ITtscEvidenceGraphClaim[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/evidence/src/projectAutoMovieNativeClaims.ts",
  ),
);

/**
 *
 * A native extension cannot reinstall companion requirements through a scalar
 * TypeScript target. Projection keeps its coverage and cardinality unchanged.
 *
 * Scenarios:
 * 1. A frozen scalar native declaration asking for review emits the same
 *    source relationship with requireReview false and leaves its input intact.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `projectAutoMovieNativeClaims` on one frozen claim whose scalar TypeScript reference asks for review with exclusion, uniqueness and single-evidence rules, and asserts the projected claim and the input reference's `requireReview`; it catches a scalar reference skipped by the companion removal that handles arrays, a scalar wrapped into an array, any coverage or cardinality flag dropped, and a write into the caller's frozen reference.
 * @evidence contracts/testing.md#independent-expectations The expected claim is the input with only `requireReview` flipped to false on its scalar reference, as the projection documents for every reference; the input check reads the original `true`, so the oracle is the declaration itself rather than any projected output.
 * @evidence contracts/testing.md#distinguishing-cases Boundary of a scalar, not array, reference on a native claim without binding metadata; array references, mixed severities and binding removal belong to `test_evidence_native_claim_projection`, and empty reference arrays to `test_evidence_native_empty_reference_projection`.
 */
export const test_evidence_native_scalar_companion_removal = (): void => {
  const reference = Object.freeze({
    type: "typescript" as const,
    root: "src",
    files: ["**/*.ts", "!index.ts"],
    symbol: ["function", "property"] as ("function" | "property")[],
    noEvidenceExclude: true,
    uniqueEvidence: true,
    singleEvidencePerSymbol: true,
    requireReview: true,
  });
  const claim: ITtscEvidenceGraphClaim = Object.freeze({
    name: "one exact native source relationship",
    type: "typescript",
    files: ["src/consumer.ts"],
    symbol: "function",
    reference,
  });
  TestValidator.equals(
    "extension retains its relationship",
    projection.projectAutoMovieNativeClaims([claim]),
    [{ ...claim, reference: { ...reference, requireReview: false } }],
  );
  TestValidator.equals(
    "submitted policy remains intact",
    reference.requireReview,
    true,
  );
};
