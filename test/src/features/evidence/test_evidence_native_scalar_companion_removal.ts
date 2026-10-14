import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphReference } from "@ttsc/evidence";

import { projectAutoMovieNativeClaims } from "../../../../packages/evidence/src/projectAutoMovieNativeClaims";

/**
 * A native extension cannot reinstall companion requirements through a scalar
 * TypeScript target. Projection keeps its coverage and cardinality unchanged.
 *
 * Scenarios:
 *
 * 1. A frozen scalar native declaration asking for review emits the same
 *    source relationship with requireReview false and leaves its input intact.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls projectAutoMovieNativeClaims with a frozen scalar TypeScript reference and checks complete output structure plus the unchanged input review flag, catching an array-only projection or mutation of the submitted companion requirement.
 * @evidence contracts/testing.md#independent-expectations The authored claim's selectors, symbol depths and cardinality flags must remain unchanged while the product's companion-removal policy makes requireReview false; the literal expected record derives from that policy and supplied input, without invoking the projector for an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Owns a scalar source reference with review requested and frozen records; mixed reference arrays and empty claim populations belong to test_evidence_native_claim_projection, and empty reference arrays to the separate boundary test.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_native_scalar_companion_removal entry directly imports the source function and owns one portable projection, requiring no consumer installation, native compilation or running host.
 */
export function test_evidence_native_scalar_companion_removal(): void {
  const reference: Readonly<Extract<ITtscEvidenceGraphReference, { type: "typescript" }>> = Object.freeze({
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
    projectAutoMovieNativeClaims([claim]),
    [{ ...claim, reference: { ...reference, requireReview: false } }],
  );
  TestValidator.equals(
    "submitted policy remains intact",
    reference.requireReview,
    true,
  );
}
