import {
  type AutoMovieProductionContractClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";

import { throwsError } from "../internal/predicates";

/**
 * AutoMovie principle metadata retains its owning checklist policy rather than
 * describing a stronger obligation than the native evaluator receives.
 *
 * Scenarios:
 *
 * 1. Every stage and both passes admit canonical single and multiple targets,
 *    scalar references, alternate document roots, and pilot-only audits.
 * 2. Claim and reference severity, exclusion, review, cardinality, target kind,
 *    host kind, and malformed target inventories cannot detach from that policy.
 * 3. Metadata-free native declarations retain their independently chosen policy.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls principle construction and local binding admission across both passes and all four stages, admitting canonical reference shapes and refusing changes to severity, exclusions, review, cardinality or selector ownership. This catches metadata that describes a stronger duty than its native claim actually enforces.
 * @evidence contracts/testing.md#independent-expectations The local principle contract fixes per-heading H2 checklist coverage with no evidence exclusion, no companion review and no severity override; literal single/multiple flat documents and scalar/array representations are equivalent under that contract. Expected refusals are not reconstructed with a validator helper in the test.
 * @evidence contracts/testing.md#distinguishing-cases Crosses eight pass/stage declarations with canonical variants, twenty-one reference mutations, claim policy mutations and a pilot-only audit, then removes binding metadata to permit an independently configured native twin. Host root/path normalization is covered separately.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_local_principle_policy entry owns its deterministic declaration loops and all mutations in-process, without evaluating resident prose, installing a consumer, compiling native code or starting a host.
 */
export function test_evidence_local_principle_policy(): void {
  const blank: ReturnType<typeof createBlankAutoMovieProductionEvidence> = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  for (const pass of ["construction", "naturalness"] as const)
    for (const stage of ["disabled", "draft", "evidence", "review"] as const) {
      const props: Parameters<typeof createAutoMovieProductionPrincipleClaim>[0] & { document: string } = {
        name: "one authored expression rule",
        document: "contracts/expression.md",
        files: [
          pass === "construction"
            ? "screenplays/*/*.md"
            : "final/screenplays/*/*.md",
        ],
        symbol: ["h2", "h3", "h4"] as ("h2" | "h3" | "h4")[],
        layer: "screenplays" as const,
        stage,
        pass,
        populationScope: blank.populationScope,
      };
      const claim: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim(props);
      const graph: typeof blank = {
        ...blank,
        screenplays: stage,
        naturalness: { screenplays: stage },
        claims: [claim],
      };
      const reference: ITtscEvidenceGraphMarkdownReference = (
        claim.reference as ITtscEvidenceGraphMarkdownReference[]
      )[0]!;
      for (const valid of [
        claim,
        { ...claim, severity: undefined },
        { ...claim, reference },
        createAutoMovieProductionPrincipleClaim({
          ...props,
          document: [props.document, "contracts/another.md"],
        }),
        createAutoMovieProductionPrincipleClaim({
          ...props,
          documentRoot: "docs/contracts",
          document: "expression.md",
          symbol: "h2",
        }),
      ])
        validateAutoMovieLocalContractClaims({ ...graph, claims: [valid] });

      const referenceMutations: Partial<ITtscEvidenceGraphMarkdownReference>[] =
        [
          { noEvidenceExclude: false },
          { noEvidenceExclude: undefined },
          { requireReview: true },
          { requireReview: undefined },
          { severity: "warning" },
          { severity: "off" },
          { severity: 0 },
          { severity: "error" },
          { symbol: "file" },
          { symbol: "h1" },
          { symbol: undefined },
          { checklist: false },
          { checklist: undefined },
          { uniqueEvidence: true },
          { singleEvidencePerSymbol: true },
          { root: "." },
          { root: undefined },
          { files: [] },
          { files: [props.document, "contracts/another.md"] },
          { files: ["contracts/index.md"] },
          { files: ["contracts/nested/rule.md"] },
        ];
      const mutations: Partial<AutoMovieProductionContractClaim>[] = [
        ...referenceMutations.map((change: Partial<ITtscEvidenceGraphMarkdownReference>): Partial<AutoMovieProductionContractClaim> => ({
          reference: [{ ...reference, ...change }],
        })),
        ...(["off", 0, "warning", "error", 2] as const).map((severity: AutoMovieProductionContractClaim["severity"]): Partial<AutoMovieProductionContractClaim> => ({
          severity,
        })),
        { name: undefined },
        { symbol: undefined },
        { symbol: "file" },
        { symbol: "h1" },
        { symbol: [] },
        { symbol: ["h2", "file"] },
        { reference: [] },
        { reference: [reference, reference] },
        { reference: { type: "typescript", files: ["src/rules.ts"] } },
        {
          reference: [
            reference,
            { type: "typescript", files: ["src/rules.ts"] },
          ],
        },
      ];
      for (const mutation of mutations)
        TestValidator.predicate(
          `refuse ${pass} ${stage} detached policy ${JSON.stringify(mutation)}`,
          throwsError((): void =>
            validateAutoMovieLocalContractClaims({
              ...graph,
              claims: [{ ...claim, ...mutation }],
            }),
          ),
        );

      const scope: typeof blank.populationScope = {
        mode: "first-pilot" as const,
        partitionGroup: "001-first" as const,
      };
      const audit: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim({
        ...props,
        populationScope: scope,
        inapplicable: true,
      });
      validateAutoMovieLocalContractClaims({
        ...graph,
        populationScope: scope,
        claims: [audit],
      });
      const { autoMovieBinding: _binding, ...native }: AutoMovieProductionContractClaim = claim;
      validateAutoMovieLocalContractClaims({
        ...graph,
        claims: [
          {
            ...native,
            root: "independent",
            symbol: "file",
            severity: "warning",
            reference: {
              type: "typescript",
              files: ["src/rules.ts"],
              noEvidenceExclude: false,
              requireReview: false,
            },
          },
        ],
      });
    }
}
