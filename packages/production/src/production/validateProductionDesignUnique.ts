import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check nonblank identity before duplicate membership, then insert the identity even when it was invalid.
 *
 * @evidence contracts/common.md#principled-implementation Nonblank-text admission precedes exact Set membership and unconditional insertion, so a repeated blank identity can produce both text and duplicate findings. The caller supplies the mutable finding array and the seen population for its current field.
 * @evidence contracts/common.md#clear-and-simple-design One scalar identity operation serves model, world, shot and named-state populations; each caller owns the Set scope and the graph coordinator owns final diagnostic sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IDs are neither trimmed, renamed nor case-folded for membership; invalid values still enter seen so later occurrences cannot bypass duplicate reporting.
 * @evidence contracts/common.md#meaningful-documentation Documents text-before-duplicate order, exact identity, unconditional Set mutation and appended findings; no design record is modified and the void result is not an admission certificate.
 * @evidence contracts/performance.md#efficient-algorithms One text scan and expected constant set lookup/insertion per identity, with one retained key per distinct value.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's current seen Set shares membership across one field population; this helper neither recreates that population nor caches it beyond caller ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains seen with one key per distinct supplied identity and diagnostics with every appended finding until its enclosing validation releases them; this helper opens no handle or task and does not clear either borrowed population.
 */
export const validateProductionDesignUnique: (diagnostics: IAutoMovieDiagnostic[], seen: Set<string>, id: string, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  seen: Set<string>,
  id: string,
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignText(diagnostics, id, target, file, `${field}.id`);
  if (seen.has(id))
    validateProductionDesignInvalid(
      diagnostics,
      "design-duplicate-id",
      target,
      file,
      `Duplicate id "${id}" appears in ${field}. Keep each id once in its design setter.`,
    );
  seen.add(id);
};
