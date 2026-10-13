import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerInputs } from "./IHumanViewerInputs.js";

/**
 * Pass the documents the viewer authors (standard people and standard body
 * states) through the page owner's admission, like hand-written inputs: an
 * admitted entry is drawable, any other is listed as `viewer-authored <id>`
 * with the owner's reason and whether it is still pending, so a wrong shape
 * surfaces at `/docs` rather than only as a render refusal.
 */
export function admitHumanViewerAuthoredEntries(
  entries: readonly IHumanViewerCatalogueEntry[],
  admit: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission,
): IHumanViewerInputs {
  const result: IHumanViewerInputs = { documents: [], rejected: [] };
  for (const entry of entries) {
    const admission = admit(entry);
    if (admission.state === "admitted") result.documents.push(entry);
    else
      result.rejected.push({
        file: `viewer-authored ${entry.id}`,
        reason: `${entry.id}: ${admission.reason ?? admission.state}`,
        pending: admission.state === "pending",
        id: entry.id,
        ...(admission.state === "pending" ? { candidate: entry } : {}),
      });
  }
  return result;
}
