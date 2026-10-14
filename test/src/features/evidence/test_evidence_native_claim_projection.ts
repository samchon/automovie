import {
  type IAutoMovieEvidenceConfigProps,
  createAutoMovieProductionObligationClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphClaim, ITtscEvidenceGraphMarkdownReference, ITtscEvidenceGraphReference } from "@ttsc/evidence";

import { projectAutoMovieNativeClaims } from "../../../../packages/evidence/src/projectAutoMovieNativeClaims";

/**
 * Native evaluation must not erase the declaration a manifest still consumes.
 *
 * Scenarios:
 *
 * 1. Admitted principle and population-account claims lose binding metadata and
 *    companion requirements while retaining every structural relationship.
 * 2. Mixed error/warning references retain selectors and structural policy without companion requirements.
 * 3. Frozen declarations and empty populations remain unchanged by projection.
 *
 * @evidence contracts/testing.md#behavioral-verification Admits local obligation and principle claims then calls projectAutoMovieNativeClaims with those and a mixed native claim, checking claim order, removal of binding metadata, every remaining field and unchanged submitted data. This detects dropped selectors or cardinality, retained companion requirements and mutation of manifest inputs.
 * @evidence contracts/testing.md#independent-expectations The contract preserves authored fields except autoMovieBinding and makes requireReview false on each reference; expectations derive from the original frozen declarations and that single stated transformation, not from another projector. JSON comparison observes serializable input content, while direct identity assertions require fresh claim records.
 * @evidence contracts/testing.md#distinguishing-cases Covers admitted aggregate and per-unit local claims, a native TypeScript host with error and warning Markdown references, frozen records and array, and no claims; scalar native references and empty reference arrays are separate boundary tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_native_claim_projection entry owns construction, local admission and projection checks in-process through typed product imports, without installing a consumer, compiling native code, reading project files or starting a host.
 */
export function test_evidence_native_claim_projection(): void {
  const blank: IAutoMovieEvidenceConfigProps = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const props: Parameters<typeof createAutoMovieProductionObligationClaim>[0] = {
    name: "local obligation",
    account: "accounts/models/local.md",
    document: "contracts/obligations-models.md",
    layer: "models" as const,
    stage: "review" as const,
    populationScope: blank.populationScope,
  };
  const account: ReturnType<typeof createAutoMovieProductionObligationClaim> = createAutoMovieProductionObligationClaim(props);
  const principle: ReturnType<typeof createAutoMovieProductionPrincipleClaim> = createAutoMovieProductionPrincipleClaim({
    ...props,
    name: "local principle",
    document: "contracts/principles-models.md",
    files: ["models/**/*.md"],
    symbol: ["h2", "h3", "h4"],
  });
  const structural: ITtscEvidenceGraphMarkdownReference = {
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
  const claims: NonNullable<IAutoMovieEvidenceConfigProps["claims"]> = [account, principle, native];
  validateAutoMovieLocalContractClaims({ ...blank, models: "review", claims });
  const before: string = JSON.stringify(claims);
  for (const claim of claims) Object.freeze(claim);
  Object.freeze(claims);
  const projected: ITtscEvidenceGraphClaim[] = projectAutoMovieNativeClaims(claims);
  const compare: (left: string, right: string) => number = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0;
  TestValidator.equals(
    "claim order",
    projected.map((claim: ITtscEvidenceGraphClaim): string | undefined => claim.name),
    [props.name, "local principle", "rendered realization"],
  );
  for (const [index, claim] of claims.entries()) {
    const output: ITtscEvidenceGraphClaim = projected[index]!;
    TestValidator.equals(
      "native metadata is absent",
      Reflect.has(output, "autoMovieBinding"),
      false,
    );
    TestValidator.predicate("projection owns a new record", output !== claim);
    for (const key of Object.keys(claim).filter(
      (key: string): boolean => key !== "autoMovieBinding",
    ))
      TestValidator.equals(
        `native field ${key} is retained`,
        Reflect.get(output, key),
        key === "reference"
          ? (Array.isArray(claim.reference)
              ? claim.reference
              : [claim.reference]
            ).map((reference: ITtscEvidenceGraphReference): ITtscEvidenceGraphReference => ({ ...reference, requireReview: false }))
          : Reflect.get(claim, key),
      );
    TestValidator.equals(
      "no additional fields",
      Object.keys(output).sort(compare),
      Object.keys(claim)
        .filter((key: string): boolean => key !== "autoMovieBinding")
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
}
