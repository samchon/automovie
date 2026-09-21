import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation } from "./pushViolation";

/**
 * Validate uniqueness for an explicit list of ids and source paths.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateUniqueBy` reports each repeated artifact identity at the explicit source path paired with that occurrence.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateUniqueBy` checks declared string identities without substituting traversal order for the caller's member address.
 */
export const validateUniqueBy = (
  entries: { id: unknown; path: string }[],
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (typeof entry.id !== "string") continue;
    if (seen.has(entry.id))
      pushViolation(
        violations,
        "type",
        entry.path,
        `${label} "${entry.id}" must be unique`,
        entry.id,
      );
    seen.add(entry.id);
  }
};
