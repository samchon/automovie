import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerInputs } from "./IHumanViewerInputs.js";

/**
 * Pass the documents the viewer authors (standard people and standard body states) through the page owner's admission, like hand-written inputs: an admitted entry is drawable, any other is listed as `viewer-authored <id>` with the owner's reason and whether it is still pending, so a wrong shape surfaces at `/docs` rather than only as a render refusal.
 *
 * @evidence contracts/common.md#principled-implementation Every application-authored descriptor queries the page owner's admission; only admitted entries become drawable, while pending/refused records preserve identity and cause.
 * @evidence contracts/common.md#clear-and-simple-design One ordered partition applies the same admission seam to standard people and body states without embedding numerical validators in catalogue code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Viewer-authored examples receive no acceptance exception, and pending candidates remain descriptors instead of drawables.
 * @evidence contracts/common.md#meaningful-documentation The comment defines admitted versus rejected publication, viewer-authored refusal labels and visibility at docs before rendering.
 * @evidence contracts/performance.md#efficient-algorithms N descriptors require one admission query and one output append each, with O(N) result references and no repeated catalogue scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This partition re-queries current verdicts; source/document-key equivalence and in-flight sharing belong to the admission owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Result arrays borrow input descriptors and retain no numerical task, viewport or GPU resource; the published catalogue owns their lifetime.
 */
export function admitHumanViewerAuthoredEntries(
  entries: readonly IHumanViewerCatalogueEntry[],
  admit: (entry: IHumanViewerCatalogueEntry) => IHumanViewerAdmission,
): IHumanViewerInputs {
  const result: IHumanViewerInputs = { documents: [], rejected: [] };
  for (const entry of entries) {
    const admission: IHumanViewerAdmission = admit(entry);
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
