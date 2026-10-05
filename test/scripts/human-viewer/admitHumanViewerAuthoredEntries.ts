import type { IHumanViewerAdmission } from "./IHumanViewerAdmission";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerInputs } from "./IHumanViewerInputs";

/**
 * Pass the documents the viewer authors (standard people and standard body
 * states) through the page owner's admission, like hand-written inputs: an
 * admitted entry is drawable, any other is listed as `viewer-authored <id>`
 * with the owner's reason and whether it is still pending, so a wrong shape
 * surfaces at `/docs` rather than only as a render refusal.
 *
 * @evidence contracts/common.md#principled-implementation A viewer-authored document is drawable only after its owner admitted it.
 * @evidence contracts/common.md#clear-and-simple-design One step owns the verdict split; the admission itself is injected.
 * @evidence contracts/common.md#meaningful-documentation States what is drawable and how the rest is listed.
 */
export function admitHumanViewerAuthoredEntries(
  entries: readonly IHumanViewerCatalogueEntry[],
  admit: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission,
): IHumanViewerInputs {
  const result: IHumanViewerInputs = { documents: [], rejected: [] };
  for (const entry of entries) {
    const admission = admit(entry);
    if (admission.state === "admitted") result.documents.push(entry);
    else result.rejected.push({ file: `viewer-authored ${entry.id}`,
      reason: `${entry.id}: ${admission.reason ?? admission.state}`,
      pending: admission.state === "pending", id: entry.id });
  }
  return result;
}
