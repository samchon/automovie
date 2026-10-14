/**
 * Inputs of `mountConnectedPersonAdmissionReport`: where the report is drawn and the sink that saves it on request.
 *
 * The container stays outside the editing fieldset so refused constructions still expose their checks. Downloading initiates delivery of the requested JSON and supplies no browser save-completion or admission verdict.
 *
 * @evidence contracts/common.md#principled-implementation Separate report DOM remains accessible for accepted or refused displayed constructions, and explicit byte delivery preserves owner reports independently of model admission.
 * @evidence contracts/common.md#clear-and-simple-design The mount receives only its container and file sink while the panel supplies actual displayed evaluation identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled editing does not hide refused checks, and report delivery does not imply accepted numerical or clinical geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment explains report accessibility, JSON handoff and absence of save/admission proof.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input schema selects no report serialization or browser delivery algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The props declare no cached report or equivalent numerical evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Container and sink are borrowed references; the mount and download implementation own resulting listeners and URLs.
 *
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReportProps {
  /** Element the report fills; it stays outside the editing fieldset. */
  container: HTMLElement;

  /**
   * Initiate explicit report JSON delivery with its evaluation-derived filename and media type.
   *
   * @evidence contracts/common.md#principled-implementation The numerical owner's report and evaluation identities are encoded before this byte handoff reaches the browser sink.
   * @evidence contracts/common.md#clear-and-simple-design Delivery is delegated so the report mount owns no object URL or anchor implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts File handoff certifies neither completed saving nor successful model admission.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies explicit report payload, filename provenance and media metadata.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This sink type chooses no Blob or file delivery algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Saving a report is an effect and does not share a numerical result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary browser delivery resources belong to the supplied sink implementation.
   */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
