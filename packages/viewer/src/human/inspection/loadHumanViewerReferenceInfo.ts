import type { IHumanViewerReferenceInfo } from "@automovie/viewer/human/inspection/IHumanViewerReferenceInfo";

/**
 * Ask whether a local reference photograph exists for a document, and where its camera stood. A failed request reads as no photograph, so the controls simply offer no comparison. A transport, HTTP or unreadable JSON failure returns unavailable. Successful JSON remains a typed local-service projection rather than runtime schema admission, and availability does not establish photographic calibration or personal anatomy validity.
 *
 * @evidence contracts/common.md#principled-implementation URLSearchParams encodes the document identity and the local reference-info endpoint supplies optional photo/camera metadata; transport or HTTP/parse refusal becomes explicit unavailable state.
 * @evidence contracts/common.md#clear-and-simple-design One browser metadata reader leaves photo storage, calibration and display composition with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure supplies no guessed photograph, camera or landmarks, and typed successful JSON is not asserted to validate schema or clinical geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies optional comparison, unavailable failure paths, unchecked successful transport and calibration/anatomy limits.
 * @evidence contracts/performance.md#efficient-algorithms Request construction and JSON decoding scale with d document-id characters and b response bytes, retaining only the returned metadata without reading photo pixels.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This reader owns no cross-document request cache; reference metadata freshness and caller selection determine request frequency.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One fetch response and decoded record are scoped to the call; this helper owns no timer, object URL or persistent image resource and offers no cancellation handle.
 */
export async function loadHumanViewerReferenceInfo(
  doc: string,
): Promise<IHumanViewerReferenceInfo> {
  try {
    const response: Response = await fetch(
      "/reference-info?" + new URLSearchParams({ doc }),
    );
    if (!response.ok) return { available: false, camera: null, landmarks: [] };
    return (await response.json()) as IHumanViewerReferenceInfo;
  } catch {
    return { available: false, camera: null, landmarks: [] };
  }
}
