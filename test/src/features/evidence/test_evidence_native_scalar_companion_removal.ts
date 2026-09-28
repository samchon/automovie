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
 * A native extension cannot reinstall companion requirements through a scalar
 * TypeScript target. Projection keeps its coverage and cardinality unchanged.
 *
 * Scenarios:
 * 1. A frozen scalar native declaration asking for review emits the same
 *    source relationship with requireReview false and leaves its input intact.
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
