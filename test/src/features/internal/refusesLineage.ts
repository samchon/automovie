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
 * Structure and derivation tests supply their expected kind and path fragment and own the Boolean assertions. This helper registers no test and acquires no external resource.
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
