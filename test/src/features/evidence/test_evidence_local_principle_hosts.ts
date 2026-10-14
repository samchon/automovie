import {
  type AutoMovieProductionContractClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A local principle's native hosts must agree with its declared authored pass.
 * Metadata cannot describe final screenplay work while lint selects construction
 * files or a different root. Independent native claims keep their own roots.
 *
 * Scenarios:
 *
 * 1. Construction and naturalness principles admit their respective populations,
 *    including normalized exclusions within the same authored pass.
 * 2. Mutated roots, cross-pass hosts, path aliases, and empty, subtractive,
 *    blank, or duplicate populations are refused before native projection.
 * 3. A metadata-free native claim remains outside AutoMovie binding validation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the principle constructor and validateAutoMovieLocalContractClaims for both authored passes, admits same-pass positive and negative selectors, and refuses detached roots or malformed host populations while allowing an unbound native declaration its independent root.
 * @evidence contracts/testing.md#independent-expectations Construction screenplay hosts begin screenplays and final hosts begin final/screenplays under docs; literal selector mutations violate normalized, positive, distinct, same-pass ownership. Expected refusals do not depend on matching files or an implementation-produced host inventory.
 * @evidence contracts/testing.md#distinguishing-cases Runs both passes across seventeen root, prefix, path-form, empty, subtractive, blank, duplicate and foreign-exclusion mutations, alongside the valid same-pass exclusion and metadata-free native twin; reference severity and cardinality belong to test_evidence_local_principle_policy.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_local_principle_hosts entry owns both pass loops and every literal mutation through direct in-process constructors and admission, with no filesystem, installed consumer, native artifact or evaluator host.
 */
export function test_evidence_local_principle_hosts(): void {
  const blank: ReturnType<typeof createBlankAutoMovieProductionEvidence> = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  for (const pass of ["construction", "naturalness"] as const) {
    const prefix: string =
      pass === "construction" ? "screenplays" : "final/screenplays";
    const claim: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim({
      name: "one local screenplay rule",
      document: "contracts/screenplay-rule.md",
      layer: "screenplays",
      pass,
      stage: "review",
      populationScope: blank.populationScope,
      files: [`${prefix}/*/???-*.md`, `!${prefix}/001-first/002-excluded.md`],
      symbol: ["h2", "h3", "h4"],
    });
    const graph: typeof blank = {
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
        throwsError((): void =>
          validateAutoMovieLocalContractClaims({
            ...graph,
            claims: [{ ...claim, ...mutation }],
          }),
        ),
      );
    const { autoMovieBinding: _binding, ...native }: AutoMovieProductionContractClaim = claim;
    validateAutoMovieLocalContractClaims({
      ...graph,
      claims: [{ ...native, root: "independent", files: ["authored/**/*.md"] }],
    });
  }
}
