import {
  type AutoMovieProductionContractClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 *
 * A local principle's native hosts must agree with its declared authored pass.
 * Metadata cannot describe final screenplay work while lint selects construction
 * files or a different root. Independent native claims keep their own roots.
 *
 * Scenarios:
 * 1. Construction and naturalness principles admit their respective populations,
 *    including normalized exclusions within the same authored pass.
 * 2. Mutated roots, cross-pass hosts, path aliases, and empty, subtractive,
 *    blank, or duplicate populations are refused before native projection.
 * 3. A metadata-free native claim remains outside AutoMovie binding validation.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds a screenplay principle with `createAutoMovieProductionPrincipleClaim` for the construction and the naturalness pass, admits it through `validateAutoMovieLocalContractClaims`, then expects a refusal for each host mutation and acceptance for the same claim stripped of its binding metadata; it catches metadata that says construction while lint selects final files or the reverse, a root moved off `docs`, a host glob for another layer, backslash, absolute, drive, doubled-slash, dot or parent-segment aliases, and empty, exclusion-only, blank, duplicate or foreign-exclusion populations.
 * @evidence contracts/testing.md#independent-expectations Accept and refuse outcomes restate the documented rule that a bound principle's native hosts must be normalized globs rooted at `docs` within its own authored pass, with exclusions inside that pass allowed; native claims without metadata keep any root by design; refusals use `throwsError` without fragments, so each mutation shows only that some refusal fired.
 * @evidence contracts/testing.md#distinguishing-cases Positive claim per pass including a same-pass exclusion, and a positive native twin with an unrelated root; seventeen negatives per pass covering roots, cross-pass and cross-layer hosts, six path aliases and five malformed populations; checklist policy, severity and reference mutations belong to `test_evidence_local_principle_policy`, and obligation accounts to `test_evidence_local_account_claim`.
 */
export const test_evidence_local_principle_hosts = (): void => {
  const blank = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  for (const pass of ["construction", "naturalness"] as const) {
    const prefix =
      pass === "construction" ? "screenplays" : "final/screenplays";
    const claim = createAutoMovieProductionPrincipleClaim({
      name: "one local screenplay rule",
      document: "contracts/screenplay-rule.md",
      layer: "screenplays",
      pass,
      stage: "review",
      populationScope: blank.populationScope,
      files: [`${prefix}/*/???-*.md`, `!${prefix}/001-first/002-excluded.md`],
      symbol: ["h2", "h3", "h4"],
    });
    const graph = {
      ...blank,
      screenplays: "review" as const,
      naturalness: { screenplays: "review" as const },
      claims: [claim],
    };
    validateAutoMovieLocalContractClaims(graph);
    const mutations: Partial<AutoMovieProductionContractClaim>[] = [
      { root: undefined },
      { root: "." },
      { root: "outside" },
      { root: "docs/final" },
      {
        files: [
          pass === "construction"
            ? "final/screenplays/*/*.md"
            : "screenplays/*/*.md",
        ],
      },
      { files: ["models/**/*.md"] },
      { files: [`${prefix}\\unit.md`] },
      { files: [`/${prefix}/unit.md`] },
      { files: [`D:/${prefix}/unit.md`] },
      { files: [`${prefix}//unit.md`] },
      { files: [`${prefix}/./unit.md`] },
      { files: [`${prefix}/../unit.md`] },
      { files: [] },
      { files: [`!${prefix}/*/*.md`] },
      { files: [`${prefix}/*/*.md`, " "] },
      { files: [`${prefix}/*/*.md`, `${prefix}/*/*.md`] },
      { files: [`${prefix}/*/*.md`, "!models/**/*.md"] },
    ];
    for (const mutation of mutations)
      TestValidator.predicate(
        `refuse detached ${pass} hosts ${JSON.stringify(mutation)}`,
        throwsError(() =>
          validateAutoMovieLocalContractClaims({
            ...graph,
            claims: [{ ...claim, ...mutation }],
          }),
        ),
      );
    const { autoMovieBinding: _binding, ...native } = claim;
    validateAutoMovieLocalContractClaims({
      ...graph,
      claims: [{ ...native, root: "independent", files: ["authored/**/*.md"] }],
    });
  }
};
