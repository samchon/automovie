import type { IAutoMovieViolationCollector } from "@automovie/interface";

/*
 * Report a duplicate sibling identity, then record the identity as seen.
 */
export function validateSoftIdentity(
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
): void {
  if (seen.has(id))
    out.push("type", `${path}.id`, `${label} id "${id}" is duplicated`, id);
  seen.add(id);
}
