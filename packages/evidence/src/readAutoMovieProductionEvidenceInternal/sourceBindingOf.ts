import { createAutoMovieContractBindingManifest } from "../createAutoMovieContractBindingManifest";
import type { IAutoMovieProductionEvidenceSourceBinding } from "../IAutoMovieProductionEvidenceSourceBinding";
import { compareCodeUnits } from "./compareCodeUnits";
import { resolveAutoMovieProductionEvidencePopulationFiles } from "../resolveAutoMovieProductionEvidencePopulationFiles";


/** Derive one design branch's active source lineage from manifest populations.
 *
 * @evidence contracts/common.md#principled-implementation Manifest lineage candidates must target the exact design-owner glob; source identity uses the first candidate while selected symbol kinds are unioned deterministically.
 * @evidence contracts/common.md#clear-and-simple-design Design owners share one manifest-derived source binding instead of a second manually maintained source table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent source branch remains null; multiple eligible candidates currently rely on manifest consistency for shared root and stage, which this helper does not revalidate.
 * @evidence contracts/common.md#meaningful-documentation The comment states manifest authority and active source lineage; fields retain activation, selectors and exact existing paths.
 * @evidence contracts/performance.md#efficient-algorithms For B bindings and F selected files, filtering is O(B), symbol union is linear plus sorting, and controlled population resolution dominates filesystem work.
 * @evidence contracts/performance.md#reuse-equivalent-work One branch result is shared by its design documents; separate branches currently repeat population resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only binding metadata and path strings escape; graph-owned inputs remain unchanged and helper-local candidate arrays are released.
 */
export const sourceBindingOf: (root: string, designBranch: string, bindings: ReturnType<typeof createAutoMovieContractBindingManifest>["bindings"]) => IAutoMovieProductionEvidenceSourceBinding | null = (
  root: string,
  designBranch: string,
  bindings: ReturnType<
    typeof createAutoMovieContractBindingManifest
  >["bindings"],
): IAutoMovieProductionEvidenceSourceBinding | null => {
  const ownerPattern: string = `${designBranch}/**/*.md`;
  const candidates: typeof bindings = bindings.filter(
    (binding: typeof bindings[number]) : boolean =>
      binding.relationship === "lineage" &&
      binding.host.type === "typescript" &&
      binding.target.type === "population" &&
      binding.target.root === "docs" &&
      binding.target.files.includes(ownerPattern),
  );
  if (candidates.length === 0) return null;
  const candidate: typeof bindings[number] = candidates[0]!;
  return {
    branch: candidate.branch,
    stage: candidate.stage,
    enforced: candidate.enforced,
    root: candidate.host.root,
    files: [...candidate.host.files],
    symbols: [...new Set(candidates.flatMap((item: typeof bindings[number]) : readonly string[] => item.host.symbols))].sort(
      compareCodeUnits,
    ),
    paths: resolveAutoMovieProductionEvidencePopulationFiles(
      root,
      candidate.host.root,
      candidate.host.files,
    ),
  };
};
