import {
  type IAutoMovieEvidenceConfigProps,
  createAutoMovieProductionObligationClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { projectAutoMovieNativeClaims } = loadSourceModule<{
  projectAutoMovieNativeClaims: (
    claims: Readonly<NonNullable<IAutoMovieEvidenceConfigProps["claims"]>>,
  ) => ITtscEvidenceGraphClaim[];
}>(
  path.resolve(
    __dirname,
    "../../../../packages/evidence/src/projectAutoMovieNativeClaims.ts",
  ),
);

/**
 *
 * Native evaluation must not erase the declaration a manifest still consumes.
 *
 * Scenarios:
 * 1. Admitted principle and population-account claims lose binding metadata and
 *    companion requirements while retaining every structural relationship.
 * 2. Mixed error/warning references retain selectors and structural policy without companion requirements.
 * 3. Frozen declarations and empty populations remain unchanged by projection.
 *
 * @evidence contracts/testing.md#behavioral-verification Admits an obligation claim, a principle claim and a native TypeScript claim with mixed error and warning references through `validateAutoMovieLocalContractClaims`, freezes them, and calls `projectAutoMovieNativeClaims`, asserting claim order, the absence of `autoMovieBinding`, a new record per claim, every other field retained with each reference's `requireReview` set false, no added fields, the untouched serialized input, and an empty result for no claims; it catches projection that leaks binding metadata to the native evaluator, keeps companion review rows, drops or reorders references, changes severity, exclusion or cardinality, writes into the frozen declaration, or reorders claims.
 * @evidence contracts/testing.md#independent-expectations Expected records are the caller's own claims with `autoMovieBinding` removed and `requireReview: false` on every reference, which is the projection the function documents; the input's `JSON.stringify` taken before projection is the oracle for non-mutation, so a mutation that leaves the serialization equal would not be seen.
 * @evidence contracts/testing.md#distinguishing-cases Positive local obligation, local principle and metadata-free native claim in one list, a reference list mixing severities, and the empty list boundary; a single empty reference list belongs to `test_evidence_native_empty_reference_projection`, a scalar native reference to `test_evidence_native_scalar_companion_removal`, and binding validation to `test_evidence_local_account_projection`.
 */
export const test_evidence_native_claim_projection = (): void => {
  const blank = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const props = {
    name: "local obligation",
    account: "accounts/models/local.md",
    document: "contracts/obligations-models.md",
    layer: "models" as const,
    stage: "review" as const,
    populationScope: blank.populationScope,
  };
  const account = createAutoMovieProductionObligationClaim(props);
  const principle = createAutoMovieProductionPrincipleClaim({
    ...props,
    name: "local principle",
    document: "contracts/principles-models.md",
    files: ["models/**/*.md"],
    symbol: ["h2", "h3", "h4"],
  });
  const structural = {
    type: "markdown" as const,
    root: "docs",
    files: ["models/**/*.md"],
    symbol: "h2" as const,
    severity: "error" as const,
    noEvidenceExclude: true,
    singleEvidencePerSymbol: true,
  };
  const native: ITtscEvidenceGraphClaim = {
    name: "rendered realization",
    type: "typescript",
    files: ["src/**/*.ts", "!src/index.ts"],
    symbol: ["type", "function", "property"],
    reference: [
      structural,
      { ...structural, severity: "warning", requireReview: true },
    ],
  };
  const claims = [account, principle, native];
  validateAutoMovieLocalContractClaims({ ...blank, models: "review", claims });
  const before = JSON.stringify(claims);
  for (const claim of claims) Object.freeze(claim);
  Object.freeze(claims);
  const projected = projectAutoMovieNativeClaims(claims);
  const compare = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0;
  TestValidator.equals(
    "claim order",
    projected.map((claim) => claim.name),
    [props.name, "local principle", "rendered realization"],
  );
  for (const [index, claim] of claims.entries()) {
    const output = projected[index]!;
    TestValidator.equals(
      "native metadata is absent",
      Reflect.has(output, "autoMovieBinding"),
      false,
    );
    TestValidator.predicate("projection owns a new record", output !== claim);
    for (const key of Object.keys(claim).filter(
      (key) => key !== "autoMovieBinding",
    ))
      TestValidator.equals(
        `native field ${key} is retained`,
        Reflect.get(output, key),
        key === "reference"
          ? (Array.isArray(claim.reference)
              ? claim.reference
              : [claim.reference]
            ).map((reference) => ({ ...reference, requireReview: false }))
          : Reflect.get(claim, key),
      );
    TestValidator.equals(
      "no additional fields",
      Object.keys(output).sort(compare),
      Object.keys(claim)
        .filter((key) => key !== "autoMovieBinding")
        .sort(compare),
    );
  }
  TestValidator.equals(
    "manifest declaration stays intact",
    JSON.stringify(claims),
    before,
  );
  TestValidator.equals(
    "native references stay intact",
    projected[2]!.reference,
    [
      { ...structural, requireReview: false },
      { ...structural, severity: "warning", requireReview: false },
    ],
  );
  TestValidator.equals(
    "empty population stays empty",
    projectAutoMovieNativeClaims([]),
    [],
  );
};
