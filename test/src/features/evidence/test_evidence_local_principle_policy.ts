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
 *
 * AutoMovie principle metadata retains its owning checklist policy rather than
 * describing a stronger obligation than the native evaluator receives.
 *
 * Scenarios:
 * 1. Every stage and both passes admit canonical single and multiple targets,
 *    scalar references, alternate document roots, and pilot-only audits.
 * 2. Claim and reference severity, exclusion, review, cardinality, target kind,
 *    host kind, and malformed target inventories cannot detach from that policy.
 * 3. Metadata-free native declarations retain their independently chosen policy.
 *
 * @evidence contracts/testing.md#behavioral-verification For both passes and all four stages, builds a screenplay principle with `createAutoMovieProductionPrincipleClaim`, admits canonical variants and a pilot audit through `validateAutoMovieLocalContractClaims`, refuses each reference and claim mutation, and admits a metadata-free native twin with its own policy; it catches a bound principle whose native reference allows exclusion, demands review, carries any severity, loses `checklist`, gains uniqueness rules, targets a file, H1, index, nested or second document, or whose claim overrides severity, symbol, name or reference count while metadata still claims the canonical checklist.
 * @evidence contracts/testing.md#independent-expectations Outcomes restate the documented principle policy: an error-level H2 checklist on a flat contract file under `docs`, no exclusion, no review requirement, and nothing stronger than the native evaluator receives; refusals use `throwsError` without fragments, so each of the thirty-five mutations shows only that some refusal fired.
 * @evidence contracts/testing.md#distinguishing-cases Positive canonical claim, implicit severity, scalar reference, two documents, the alternate `docs/contracts` root with one symbol and a pilot-only audit, at every stage and pass; twenty-one reference and fourteen claim mutations as negatives; a native twin with warning severity and a TypeScript reference as the adjacent accepted case; host globs and roots belong to `test_evidence_local_principle_hosts`.
 */
export const test_evidence_local_principle_policy = (): void => {
  const blank = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  for (const pass of ["construction", "naturalness"] as const)
    for (const stage of ["disabled", "draft", "evidence", "review"] as const) {
      const props = {
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
      const claim = createAutoMovieProductionPrincipleClaim(props);
      const graph = {
        ...blank,
        screenplays: stage,
        naturalness: { screenplays: stage },
        claims: [claim],
      };
      const reference = (
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
        ...referenceMutations.map((change) => ({
          reference: [{ ...reference, ...change }],
        })),
        ...(["off", 0, "warning", "error", 2] as const).map((severity) => ({
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
          throwsError(() =>
            validateAutoMovieLocalContractClaims({
              ...graph,
              claims: [{ ...claim, ...mutation }],
            }),
          ),
        );

      const scope = {
        mode: "first-pilot" as const,
        partitionGroup: "001-first" as const,
      };
      const audit = createAutoMovieProductionPrincipleClaim({
        ...props,
        populationScope: scope,
        inapplicable: true,
      });
      validateAutoMovieLocalContractClaims({
        ...graph,
        populationScope: scope,
        claims: [audit],
      });
      const { autoMovieBinding: _binding, ...native } = claim;
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
};
