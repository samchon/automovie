import type { IHumanViewerReferenceInfo } from "@automovie/viewer/human/inspection/IHumanViewerReferenceInfo";

/**
 * Ask whether a local reference photograph exists for a document, and where
 * its camera stood. A failed request reads as no photograph, so the controls
 * simply offer no comparison.
 *
 * @evidence contracts/common.md#principled-implementation Requests document-bound local reference metadata and represents transport failure as unavailable with no camera or landmark observations.
 * @evidence contracts/common.md#clear-and-simple-design One read-only request supplies comparison metadata while the controls own whether to expose comparison actions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed lookup cannot fabricate a reference photograph or camera, and the fallback performs no image fitting or document mutation.
 * @evidence contracts/common.md#meaningful-documentation States the answer and the failure reading.
 */
export async function loadHumanViewerReferenceInfo(
  doc: string,
): Promise<IHumanViewerReferenceInfo> {
  try {
    return (await (
      await fetch("/reference-info?" + new URLSearchParams({ doc }))
    ).json()) as IHumanViewerReferenceInfo;
  } catch {
    return { available: false, camera: null, landmarks: [] };
  }
}
