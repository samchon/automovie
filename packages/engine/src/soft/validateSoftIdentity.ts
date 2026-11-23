import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Report blank or duplicate sibling identities, then record the identity as
 * seen.
 */
export const validateSoftIdentity: (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
) => void = (
  out: IAutoMovieViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
): void => {
  if (id.trim().length === 0)
    out.push("type", `${path}.id`, `${label} id must be non-empty`, id);
  else if (seen.has(id))
    out.push("type", `${path}.id`, `${label} id "${id}" is duplicated`, id);
  seen.add(id);
};
