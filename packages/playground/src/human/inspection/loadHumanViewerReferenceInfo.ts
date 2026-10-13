import type { IHumanViewerReferenceInfo } from "@automovie/viewer/human/inspection/IHumanViewerReferenceInfo";

/**
 * Ask whether a local reference photograph exists for a document, and where
 * its camera stood. A failed request reads as no photograph, so the controls
 * simply offer no comparison.
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
