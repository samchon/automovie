import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import { resolveAutoMovieTimedAuthoringKind } from "../../../../packages/production/src/production/resolveAutoMovieTimedAuthoringKind";
import { throwsError } from "../internal/predicates";

/** Kind-only input: the resolver reads no other evidence field. */
function evidence(kind: "brief" | "film" | "library" | null): IAutoMovieProductionEvidence {
  return ({ manifest: { kind } }) as IAutoMovieProductionEvidence;
}

/**
 * Timed builder ownership follows the declared production kind.
 *
 * Scenarios:
 *
 * 1. A direct brief uses brief owners without a screenplay prerequisite.
 * 2. A film and the compatible evidence-less path retain screenplay ownership.
 * 3. A library is excluded from the timed builder path.
 * 4. An explicitly blank declaration refuses instead of falling back to legacy film.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual timed-kind resolver and compares every returned kind, owner branch, screenplay obligation and evidence-bound flag, while requiring an explicitly unselected declaration to throw. Library returns null and absent evidence alone selects legacy-film.
 * @evidence contracts/testing.md#independent-expectations Literal brief/film/legacy-film decision records specify ownership independently of the resolver. The local fixture supplies only the manifest kind the resolver reads; its existing assertion does not establish validity of a complete production evidence graph.
 * @evidence contracts/testing.md#distinguishing-cases Retains brief, film, library, undefined evidence and present-null kind, separating compatibility from an unselected declaration. The refusal checks throwing without asserting a particular message; project opening and builder execution are not exercised.
 * @evidence contracts/testing.md#execution-ownership The named test_production_timed_authoring_kind directly imports the maintained resolver and owns these synchronous portable decisions. No source-module signature substitute, filesystem read, project opening, compiler, renderer or process participates.
 */
export function test_production_timed_authoring_kind(): void {
  TestValidator.predicate(
    "an unselected kind cannot borrow legacy film ownership",
    throwsError((): ReturnType<typeof resolveAutoMovieTimedAuthoringKind> => resolveAutoMovieTimedAuthoringKind(evidence(null))),
  );
  TestValidator.equals(
    "timed authoring ownership is kind-discriminated",
    {
      brief: resolveAutoMovieTimedAuthoringKind(evidence("brief")),
      film: resolveAutoMovieTimedAuthoringKind(evidence("film")),
      compatibleFilm: resolveAutoMovieTimedAuthoringKind(undefined),
      library: resolveAutoMovieTimedAuthoringKind(evidence("library")),
    },
    {
      brief: {
        kind: "brief",
        ownerBranch: "briefs",
        screenplayRequired: false,
        evidenceBound: true,
      },
      film: {
        kind: "film",
        ownerBranch: "screenplays",
        screenplayRequired: true,
        evidenceBound: true,
      },
      compatibleFilm: {
        kind: "legacy-film",
        ownerBranch: "screenplays",
        screenplayRequired: true,
        evidenceBound: false,
      },
      library: null,
    },
  );
}
