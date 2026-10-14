import { validateDesignLineage } from "../../../../packages/engine/src/architecture/validateDesignLineage";
import type { AutoMovieViolationKind, IAutoMovieDesignLineage } from "@automovie/interface";
import { hasViolation } from "./predicates";
import { brokenLineage } from "./brokenLineage";

/**
 * Test whether an edited fresh lineage has the caller's expected finding.
 *
 * The edit may affect several fields. Validation runs on the resulting record, and hasViolation checks the requested kind and path fragment; other findings are permitted, so this does not certify that the named defect is the only one present.
 *
 * @param edit Mutation applied once to a new renovation fixture.
 * @param path Substring required in a finding's path.
 * @param kind Required finding kind, defaulting to type.
 * @returns Whether unsuccessful validation contains a matching finding.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs validateDesignLineage on the caller-edited fresh fixture and returns hasViolation for the requested kind/path fragment. Structure and derivation consumers assert this Boolean for their literal defects; this helper does not require a single-property mutation or exact diagnostic population.
 * @evidence contracts/testing.md#independent-expectations The caller supplies the literal expected path and violation kind, defaulting to type; the product validator only supplies the actual violation population checked by hasViolation.
 * @evidence contracts/testing.md#distinguishing-cases Existing structure and derivation entries request a kind/path-fragment refusal after targeted edits to fresh fixtures, including changes spanning several fields; matching permits additional diagnostics and does not assert order or message wording.
 * @evidence contracts/testing.md#execution-ownership This portable internal leaf is reached through lineageFixtures and the existing unit consumers; it registers no case and loads no provider, external asset, process, browser or GPU.
 */
export const refusesLineage: (edit: (draft: IAutoMovieDesignLineage) => void, path: string, kind?: AutoMovieViolationKind) => boolean = (
  edit: (draft: IAutoMovieDesignLineage) => void,
  path: string,
  kind: AutoMovieViolationKind = "type",
): boolean =>
  hasViolation(
    validateDesignLineage({ lineage: brokenLineage(edit) }),
    kind,
    path,
  );
