import {
  type IAutoMovieEvidenceConfigProps,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieProductionStages,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Final wording is a separate film-only stage between construction and shots.
 *
 * Scenarios:
 *
 * 1. Blank and selected first layers remain valid without activating final.
 * 2. Each active final stage requires construction to reach evidence and is
 *    forbidden in other shapes.
 * 3. Film shots require final naturalness to reach evidence; brief shots retain
 *    their own completed parent.
 * 4. A film reset withdraws final and resets treatments, scripts and screenplays together.
 * 5. A library reset keeps its independent design/source pair, not film stages.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateAutoMovieProductionStages and observes admitted declarations and synchronous refusals across kind, parent and reset transitions, catching final screenplay activation outside films, premature shot activation or a partially reset dependency chain.
 * @evidence contracts/testing.md#independent-expectations The declared stage contract admits a blank graph, begins a selected kind with settings or research, requires construction evidence before final work and final evidence before film shots, and resets the owning branches together. Literal transitions supply the expectations without reading dependency tables or claiming actual document coverage.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all five numbered groups, crossing film, brief and library with draft, evidence and review final stages, disabled and draft parents, brief shot independence, each unsynchronized film branch and a library source mismatch; receipt host identity is checked separately.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_production_naturalness_gates entry owns every declaration and refusal loop in-process and invokes the pure stage gate directly, without installing a production, creating files or starting native evaluation or a host.
 */
export function test_evidence_production_naturalness_gates(): void {
  const blank: IAutoMovieEvidenceConfigProps = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  validateAutoMovieProductionStages(blank);
  for (const kind of ["film", "brief", "library"] as const) {
    validateAutoMovieProductionStages({ ...blank, kind, settings: "draft" });
    validateAutoMovieProductionStages({ ...blank, kind, research: "draft" });
    TestValidator.predicate(
      "a selected kind begins with an authored foundation",
      throwsError((): void => validateAutoMovieProductionStages({ ...blank, kind })),
    );
    for (const stage of ["draft", "evidence", "review"] as const)
      if (kind !== "film")
        TestValidator.predicate(
          "non-film shapes forbid final screenplay stages",
          throwsError((): void =>
            validateAutoMovieProductionStages({
              ...blank,
              kind,
              settings: "review",
              naturalness: { screenplays: stage },
            }),
          ),
        );
  }
  const film: IAutoMovieEvidenceConfigProps = {
    ...blank,
    kind: "film",
    settings: "review",
    treatments: "review",
    scripts: "review",
    screenplays: "review",
  };
  for (const stage of ["draft", "evidence", "review"] as const) {
    validateAutoMovieProductionStages({
      ...film,
      naturalness: { screenplays: stage },
    });
    TestValidator.predicate(
      "blank cannot activate final",
      throwsError((): void =>
        validateAutoMovieProductionStages({
          ...blank,
          naturalness: { screenplays: stage },
        }),
      ),
    );
    for (const parent of ["disabled", "draft"] as const)
      TestValidator.predicate(
        "final waits for construction to reach evidence",
        throwsError((): void =>
          validateAutoMovieProductionStages({
            ...film,
            screenplays: parent,
            naturalness: { screenplays: stage },
          }),
        ),
      );
    validateAutoMovieProductionStages({
      ...film,
      screenplays: "evidence",
      naturalness: { screenplays: stage },
    });
    if (stage === "draft")
      TestValidator.predicate(
        "shots wait for final naturalness to reach evidence",
        throwsError((): void =>
          validateAutoMovieProductionStages({
            ...film,
            naturalness: { screenplays: stage },
            shots: "draft",
          }),
        ),
      );
    else
      validateAutoMovieProductionStages({
        ...film,
        naturalness: { screenplays: stage },
        shots: "draft",
      });
  }
  TestValidator.predicate(
    "disabled final does not open film shots",
    throwsError((): void =>
      validateAutoMovieProductionStages({ ...film, shots: "draft" }),
    ),
  );
  validateAutoMovieProductionStages({
    ...film,
    naturalness: { screenplays: "review" },
    shots: "draft",
  });
  validateAutoMovieProductionStages({
    ...blank,
    kind: "brief",
    settings: "review",
    briefs: "review",
    shots: "draft",
  });
  const reset: IAutoMovieEvidenceConfigProps = {
    ...film,
    treatments: "draft",
    scripts: "draft",
    screenplays: "draft",
    populationScope: {
      mode: "complete-production-reset",
      owner: "author",
      transition: {
        version: 1,
        kind: "film",
        productionLocation: "/production",
        owner: "author",
        pilotScope: { mode: "first-pilot", partitionGroup: "001-opening" },
        reviewedBranches: [
          "treatments",
          "scripts",
          "screenplays",
          "screenplayNaturalness",
        ],
        retainedHosts: [],
      },
    },
  };
  // Only stage topology is judged here; the separate receipt validator owns hosts.
  validateAutoMovieProductionStages(reset);
  for (const layer of ["treatments", "scripts", "screenplays"] as const)
    TestValidator.predicate(
      "film reset is synchronized",
      throwsError((): void =>
        validateAutoMovieProductionStages({ ...reset, [layer]: "review" }),
      ),
    );
  TestValidator.predicate(
    "film reset withdraws final",
    throwsError((): void =>
      validateAutoMovieProductionStages({
        ...reset,
        naturalness: { screenplays: "draft" },
      }),
    ),
  );
  const library: IAutoMovieEvidenceConfigProps = {
    ...blank,
    kind: "library",
    settings: "review",
    models: "draft",
    modelSources: "draft",
    populationScope: {
      mode: "complete-production-reset",
      owner: "author",
      transition: {
        version: 1,
        kind: "library",
        productionLocation: "/production",
        owner: "author",
        pilotScope: { mode: "first-pilot" },
        reviewedPairs: [{ design: "models", source: "modelSources" }],
        retainedHosts: [],
      },
    },
  };
  validateAutoMovieProductionStages(library);
  TestValidator.predicate(
    "library reset needs its matching source",
    throwsError((): void =>
      validateAutoMovieProductionStages({
        ...library,
        modelSources: "disabled",
      }),
    ),
  );
}
